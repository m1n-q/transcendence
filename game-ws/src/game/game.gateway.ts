import { MatchHistoryService } from './../match-history/match-history.service';
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
@WebSocketGateway(9998, {
  cors: true,
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;
  serverId: string;
  matchMaking;
  games = new Map();
  matchingInterval = [];
  renderInterval = [];
  waitingInterval = [];
  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly matchHistoryService: MatchHistoryService,
    private readonly amqpConnection: AmqpConnection,
  ) {
    this.serverId = v4();
    this.matchMaking = new MatchMaking();
  }

  async handleConnection(@ConnectedSocket() clientSocket: Socket) {
    try {
      await this.bindUser(clientSocket);
    } catch (e) {
      clientSocket.emit('game_error', e);
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
        this.games[roomName].winner = this.games[roomName].rPlayerInfo.user_id;
      } else {
        this.games[roomName].winner = this.games[roomName].lPlayerInfo.user_id;
      }
      this.games[roomName].isFinished = true;
      if (this.games[roomName].gameResult().game_id === undefined) {
        this.server.to(`${roomName}`).emit('user_exit_room');
      }
    } else {
      clearInterval(this.matchingInterval[clientSocket.id]);
      this.matchMaking.leaveMatchingQueue(clientSocket.id);
    }
  }

  @SubscribeMessage('user_left_queue')
  async userLeftQueue(@ConnectedSocket() clientSocket: Socket) {
    clearInterval(this.matchingInterval[clientSocket.id]);
    this.matchMaking.leaveMatchingQueue(clientSocket.id);
  }

  @SubscribeMessage('user_join_queue')
  async userJoinQueue(@ConnectedSocket() clientSocket: Socket) {
    this.matchMaking.leaveMatchingQueue(clientSocket.id);
    clearInterval(this.matchingInterval[clientSocket.id]);
    try {
      await this.updateUser(clientSocket);
    } catch (e) {
      clientSocket.emit('game_error', e);
      clientSocket.disconnect(true);
      return;
    }
    clientSocket.emit('user_is_in_queue');
    this.matchingInterval[clientSocket.id] = setInterval(() => {
      const matchedId = this.matchMaking.matchMaking(clientSocket);
      if (matchedId !== clientSocket.id) {
        const roomName = v4();
        clientSocket.emit('player_matched', roomName);
        this.server.to(`${matchedId}`).emit('player_matched', roomName);
        clearInterval(this.matchingInterval[clientSocket.id]);
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
      clientSocket['waiting'] = 0;
      this.waitingInterval[roomName] = setInterval(() => {
        if (clientSocket['waiting'] === 10) {
          clientSocket.leave(roomName);
          clientSocket.emit('user_exit_room');
          clearInterval(this.waitingInterval[roomName]);
        }
        clientSocket['waiting']++;
      }, 1000);
    } else {
      clearInterval(this.waitingInterval[roomName]);
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
    if (this.games[roomName].isFinished === true) {
      this.server.to(`${roomName}`).emit('user_exit_room');
    }
    this.games[roomName].init(difficulty);
    this.server.to(`${roomName}`).emit('difficulty_changed', difficulty);
  }

  @SubscribeMessage('player_ready')
  async playerReady(@ConnectedSocket() clientSocket: Socket) {
    const roomName = clientSocket['room_name'];
    if (this.games[roomName].isFinished === true) {
      this.server.to(`${roomName}`).emit('user_exit_room');
    }
    if (this.games[roomName].playerReady === undefined) {
      this.games[roomName].playerReady = clientSocket.id;
      this.server.to(`${roomName}`).emit('counterpart_ready', clientSocket.id);
    } else if (
      this.games[roomName].playerReady !== undefined &&
      this.games[roomName].playerReady !== clientSocket.id &&
      this.games[roomName].playerReady !== roomName
    ) {
      this.games[roomName].playerReady = roomName;
      try {
        this.games[roomName].game_id =
          await this.matchHistoryService.createGameInfo(
            this.games[roomName].gameInfo(),
          );
      } catch (e) {
        clientSocket.emit('game_error', e);
        clientSocket.disconnect(true);
        return;
      }
      this.server
        .to(`${roomName}`)
        .emit('server_ready_to_start', this.games[roomName].renderInfo());
    }
  }

  @SubscribeMessage('client_ready_to_start')
  async clientReadyToStart(@ConnectedSocket() clientSocket: Socket) {
    const roomName = clientSocket['room_name'];
    if (this.games[roomName].isFinished === true) {
      this.server.to(`${roomName}`).emit('user_exit_room');
    }
    if (this.games[roomName].renderReady === false) {
      this.games[roomName].renderReady = true;
    } else {
      this.server.to(`${roomName}`).emit('game_started');
      try {
        await this.startGame(roomName);
      } catch (e) {
        clientSocket.emit('game_error', e);
        clientSocket.disconnect(true);
        return;
      }
    }
  }

  @SubscribeMessage('save_game_data')
  async saveGameData(@ConnectedSocket() clientSocket: Socket) {
    const roomName = clientSocket['room_name'];
    if (
      this.games[roomName].isRank === true &&
      this.games[roomName].isSaveData === false
    ) {
      this.games[roomName].isSaveData = true;
      this.games[roomName].finishGame();
      try {
        await this.updateGameResult(this.games[roomName]);
      } catch (e) {
        clientSocket.emit('game_error', e);
        clientSocket.disconnect(true);
        return;
      }
      this.games.delete(roomName);
      this.server.to(`${roomName}`).emit('saved_game_data');
    }
  }

  @SubscribeMessage('user_leave_room')
  async userLeaveRoom(@ConnectedSocket() clientSocket: Socket) {
    const roomName = clientSocket['room_name'];
    clientSocket.leave(roomName);
    let result;
    try {
      result = await this.matchHistoryService.readGameResult(
        this.games[roomName].game_id,
      );
    } catch (e) {
      clientSocket.emit('game_error', e);
      clientSocket.disconnect(true);
      return;
    }
    clientSocket.emit('game_result', result);
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

  async startGame(roomName: string) {
    this.renderInterval[roomName] = setInterval(async () => {
      this.games[roomName].update();
      this.server
        .to(`${roomName}`)
        .emit('game_render_data', this.games[roomName].renderData());
      if (this.games[roomName].isFinished === true) {
        this.server.to(`${roomName}`).emit('game_finished');
        clearInterval(this.renderInterval[roomName]);
      }
    }, (1 / FPS) * 1000);
  }

  async updateGameResult(game: Game) {
    const rankInfo = game.changeRankInfo();
    try {
      await this.matchHistoryService.createGameResult(game.gameResult());
      await this.matchHistoryService.createRankHistory(rankInfo.l_player);
      await this.matchHistoryService.createRankHistory(rankInfo.r_player);
    } catch (e) {
      throw new WsException(e);
    }
  }

  async updateUser(clientSocket: Socket) {
    if (clientSocket['user_info'] === undefined) {
      try {
        await this.bindUser(clientSocket);
      } catch (e) {
        throw new WsException(e);
      }
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
