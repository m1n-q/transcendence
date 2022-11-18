import { UserInfo } from './../auth/dto/user-info.dto';
import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import {
  ConnectedSocket,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
  WsException,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { AuthService } from 'src/auth/auth.service';
import { Game } from './game';
import { v4 } from 'uuid';
import { MatchMaking } from './match';
import { Body, UseFilters } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { WsExceptionsFilter } from 'src/common/ws/ws-exceptions.filter';

const FPS = 60;
@UseFilters(new WsExceptionsFilter())
@WebSocketGateway(9990, {
  cors: true,
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  serverId: string;
  matchMaking;
  games = [];
  matchingInterval = [];
  renderInterval = [];
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly amqpConnection: AmqpConnection,
  ) {
    this.serverId = v4();
    this.matchMaking = new MatchMaking();
  }

  async handleConnection(@ConnectedSocket() clientSocket: Socket) {
    let user: UserInfo;
    try {
      user = await this.bindUser(clientSocket);
    } catch (e) {
      clientSocket.disconnect(true);
      return;
    }
    console.log(clientSocket.id, ' : game websocket connected');
  }

  handleDisconnect(@ConnectedSocket() clientSocket: Socket) {
    console.log(clientSocket.id, ' : game websocket disconnect');
    const roomName = clientSocket['room_name'];
    if (roomName !== undefined) {
      clientSocket.leave(roomName);
      if (this.games[roomName].lPlayerId === clientSocket.id) {
        this.games[roomName].loser = clientSocket.id;
      } else {
        this.games[roomName].loser = this.games[roomName].rPlayerId;
      }
      this.games[roomName].isFinished = true;
    } else {
      clearInterval(this.matchingInterval[clientSocket.id]);
      this.matchMaking.leaveMatchingQueue(clientSocket.id);
    }
  }

  @SubscribeMessage('user_join_queue')
  userJoinQueue(@ConnectedSocket() clientSocket: Socket) {
    this.updateUser(clientSocket);
    clientSocket.emit('user_is_in_queue');
    this.matchingInterval[clientSocket.id] = setInterval(() => {
      const matchedId = this.matchMaking.matchMaking(clientSocket);
      if (matchedId !== clientSocket.id) {
        const roomName = v4();
        clientSocket.emit('player_matched', roomName);
        this.server.to(`${matchedId}`).emit('player_matched', roomName);
      }
    }, 1000);
  }

  @SubscribeMessage('user_join_room')
  userJoinRoom(@ConnectedSocket() clientSocket: Socket, @Body() roomName) {
    clearInterval(this.matchingInterval[clientSocket.id]);
    clientSocket.join(roomName);
    clientSocket['room_name'] = roomName;
    if (this.games[roomName] === undefined) {
      this.games[roomName] = new Game(true);
      this.games[roomName].lPlayerId = clientSocket.id;
      this.games[roomName].lPlayerInfo = clientSocket['user_info'].user;
      clientSocket['isOwner'] = true;
    } else {
      this.games[roomName].rPlayerId = clientSocket.id;
      this.games[roomName].rPlayerInfo = clientSocket['user_info'].user;
      clientSocket['isOwner'] = false;
      this.server.to(`${roomName}`).emit('user_joined_room', {
        owner: this.games[roomName].lPlayerId,
        lPlayerInfo: this.games[roomName].lPlayerInfo,
        rPlayerInfo: this.games[roomName].rPlayerInfo,
      });
    }
  }

  @SubscribeMessage('player_change_difficulty')
  playerChangeDifficulty(
    @ConnectedSocket() clientSocket: Socket,
    @Body() difficulty,
  ) {
    const roomName = clientSocket['room_name'];
    this.games[roomName].init(difficulty);
    this.server.to(`${roomName}`).emit('difficulty_changed', difficulty);
  }

  @SubscribeMessage('player_ready')
  playerReady(@ConnectedSocket() clientSocket: Socket) {
    const roomName = clientSocket['room_name'];
    if (this.games[roomName].playerReady === undefined) {
      this.games[roomName].playerReady = clientSocket.id;
      this.server.to(`${roomName}`).emit('counterpart_ready', clientSocket.id);
    } else if (
      this.games[roomName].playerReady !== undefined &&
      this.games[roomName].playerReady !== clientSocket.id &&
      this.games[roomName].playerReady !== roomName
    ) {
      this.games[roomName].playerReady = roomName;
      this.server
        .to(`${roomName}`)
        .emit('server_ready_to_start', this.games[roomName].renderInfo());
    }
  }

  @SubscribeMessage('client_ready_to_start')
  clientReadyToStart(@ConnectedSocket() clientSocket: Socket) {
    const roomName = clientSocket['room_name'];
    if (this.games[roomName].renderReady === false) {
      this.games[roomName].renderReady = true;
    } else {
      this.server.to(`${roomName}`).emit('game_started');
      this.startGame(roomName);
    }
  }

  @SubscribeMessage('user_leave_room')
  userLeaveRoom(@ConnectedSocket() clientSocket: Socket) {
    const roomName = clientSocket['room_name'];
    clientSocket.leave(roomName);
    this.updateUser(clientSocket);
    clientSocket.emit('game_result', {
      loser: this.games[roomName].loser,
      lPlayer: this.games[roomName].lPlayerInfo,
      rPlayer: this.games[roomName].rPlayerInfo,
    });
  }

  @SubscribeMessage('up_key_pressed')
  keyDownBarUp(@ConnectedSocket() clientSocket: Socket) {
    const roomName = clientSocket['room_name'];
    if (clientSocket.id === this.games[roomName].lPlayerId) {
      this.games[roomName].lPlayerInput('up', true);
    } else if (clientSocket.id === this.games[roomName].rPlayerId) {
      this.games[roomName].rPlayerInput('up', true);
    }
  }

  @SubscribeMessage('down_key_pressed')
  keyDownBarDown(@ConnectedSocket() clientSocket: Socket) {
    const roomName = clientSocket['room_name'];
    if (clientSocket.id === this.games[roomName].lPlayerId) {
      this.games[roomName].lPlayerInput('down', true);
    } else if (clientSocket.id === this.games[roomName].rPlayerId) {
      this.games[roomName].rPlayerInput('down', true);
    }
  }
  @SubscribeMessage('up_key_released')
  keyUpBarUp(@ConnectedSocket() clientSocket: Socket) {
    const roomName = clientSocket['room_name'];
    if (clientSocket.id === this.games[roomName].lPlayerId) {
      this.games[roomName].lPlayerInput('up', false);
    } else if (clientSocket.id === this.games[roomName].rPlayerId) {
      this.games[roomName].rPlayerInput('up', false);
    }
  }

  @SubscribeMessage('down_key_released')
  keyUpBarDown(@ConnectedSocket() clientSocket: Socket) {
    const roomName = clientSocket['room_name'];
    if (clientSocket.id === this.games[roomName].lPlayerId) {
      this.games[roomName].lPlayerInput('down', false);
    } else if (clientSocket.id === this.games[roomName].rPlayerId) {
      this.games[roomName].rPlayerInput('down', false);
    }
  }

  startGame(roomName: string) {
    this.renderInterval[roomName] = setInterval(() => {
      this.games[roomName].update();
      this.server
        .to(`${roomName}`)
        .emit('game_render_data', this.games[roomName].renderData());
      if (this.games[roomName].isFinished === true) {
        this.server.to(`${roomName}`).emit('game_finished');
        if (this.games[roomName].isRank === true) {
          this.games[roomName].finishGame();
          this.updateGameResult(this.games[roomName]);
        }
        clearInterval(this.renderInterval[roomName]);
      }
    }, (1 / FPS) * 1000);
  }

  async updateGameResult(game: Game) {
    const lPlayer = game.lPlayerInfo;
    const rPlayer = game.rPlayerInfo;
    try {
      // 이부을 트렌젝션 처리 해야할지 개별의 사항으로 봐야할지
      await this.userService.updateUserMmrById(lPlayer.user_id, lPlayer.mmr);
      await this.userService.updateUserMmrById(rPlayer.user_id, rPlayer.mmr);
    } catch (e) {
      throw new WsException(e);
    }
  }

  async updateUser(clientSocket: Socket) {
    if (clientSocket['user_info'] === undefined) {
      await this.bindUser(clientSocket);
    }
    const nickname = clientSocket['user_info'].user.nickname;
    let user;
    try {
      user = await this.userService.readUserByNickname(nickname);
    } catch (e) {
      throw new WsException(e);
    }
    delete user.created;
    delete user.deleted;
    clientSocket['user_info'] = { user, waiting: 0 };
  }

  async bindUser(clientSocket: Socket) {
    const access_token = clientSocket.handshake.auth['access_token'];
    let user;
    try {
      user = await this.authService.verifyJwt(access_token);
    } catch (e) {
      throw new WsException(e);
    }
    clientSocket['user_info'] = { user, waiting: 0 };
    return user;
  }
}
