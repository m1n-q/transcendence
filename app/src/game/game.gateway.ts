import { MatchHistoryService } from './../match-history/match-history.service';
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
import { MatchMaking } from './match-making';
import { Body, UseFilters } from '@nestjs/common';
import { UserService } from 'src/user/user.service';
import { WsExceptionsFilter } from 'src/common/ws/ws-exceptions.filter';

const FPS = +process.env.FPS || 60;
@UseFilters(new WsExceptionsFilter())
@WebSocketGateway(9998, {
  cors: true,
})
export class GameGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  matchMaking: MatchMaking;
  games: Map<string, Game>;
  clients: Map<string, string>;
  playUserList: Set<string>;
  matchingInterval: Map<string, any>;
  renderInterval: Map<string, any>;
  waitingInterval: Map<string, any>;

  constructor(
    private readonly authService: AuthService,
    private readonly userService: UserService,
    private readonly matchHistoryService: MatchHistoryService,
  ) {
    this.matchMaking = new MatchMaking();
    this.games = new Map<string, Game>();
    this.clients = new Map<string, string>();
    this.matchingInterval = new Map<string, any>();
    this.renderInterval = new Map<string, any>();
    this.waitingInterval = new Map<string, any>();
    this.playUserList = new Set<string>();
  }

  async handleConnection(@ConnectedSocket() clientSocket: Socket) {
    try {
      await this.bindUser(clientSocket);
      this.checkUserList(
        clientSocket['user_info'].user.user_id,
        clientSocket.id,
      );
    } catch (e) {
      clientSocket.emit('game_error', e);
      clientSocket.disconnect(true);
      return;
    }
    console.log(clientSocket.id, ' : game websocket connected');
  }

  handleDisconnect(@ConnectedSocket() clientSocket: Socket) {
    this.clients.delete(clientSocket['user_info'].user.user_id);
    console.log(clientSocket.id, ' : game websocket disconnect');
    const roomName: string = clientSocket['room_name'];
    const game: Game = this.games.get(roomName);
    if (game !== undefined) {
      clientSocket.leave(roomName);
      if (game.gameResult().game_id === undefined) {
        this.server.to(`${roomName}`).emit('user_exit_room');
        return;
      }
      game.winner =
        game.lPlayerSocketId === clientSocket.id
          ? game.rPlayerProfile.user_id
          : game.lPlayerProfile.user_id;
      game.isFinished = true;
    } else {
      clearInterval(this.matchingInterval.get(clientSocket.id));
      this.matchingInterval.delete(clientSocket.id);
      this.matchMaking.leaveMatchingQueue(clientSocket.id);
    }
  }

  @SubscribeMessage('user_left_queue')
  async userLeftQueue(@ConnectedSocket() clientSocket: Socket) {
    clearInterval(this.matchingInterval.get(clientSocket.id));
    this.matchMaking.leaveMatchingQueue(clientSocket.id);
  }

  @SubscribeMessage('user_checkout_room')
  async userCheckoutRoom(@ConnectedSocket() clientSocket: Socket) {
    const roomName: string = clientSocket['room_name'];
    clientSocket.leave(roomName);
    this.games.delete(roomName);
  }

  @SubscribeMessage('user_join_queue')
  async userJoinQueue(@ConnectedSocket() clientSocket: Socket) {
    const roomName: string = clientSocket['room_name'];
    if (roomName !== undefined && this.games.get(roomName) !== undefined) {
      return;
    }
    this.matchMaking.leaveMatchingQueue(clientSocket.id);
    clearInterval(this.matchingInterval.get(clientSocket.id));
    try {
      await this.updateUser(clientSocket);
    } catch (e) {
      clientSocket.emit('game_error', e);
      clientSocket.disconnect(true);
      return;
    }
    clientSocket.emit('user_is_in_queue');
    this.matchMaking.joinMatchingQueue(
      clientSocket.id,
      clientSocket['user_info'].user.mmr,
    );
    const interval: any = setInterval(() => {
      const matchedId: string = this.matchMaking.matchMaking(clientSocket);
      if (matchedId !== clientSocket.id) {
        const newRoomName: string = v4();
        clientSocket.emit('player_matched', newRoomName);
        this.server.to(`${matchedId}`).emit('player_matched', newRoomName);
        clearInterval(this.matchingInterval.get(clientSocket.id));
        clearInterval(this.matchingInterval.get(matchedId));
      }
    }, 1000);
    this.matchingInterval.set(clientSocket.id, interval);
  }

  @SubscribeMessage('user_join_room')
  userJoinRoom(@ConnectedSocket() clientSocket: Socket, @Body() roomName) {
    clientSocket.join(roomName);
    clientSocket['room_name'] = roomName;
    let game: Game = this.games.get(roomName);
    if (game === undefined) {
      game = new Game(true);
      game.lPlayerSocketId = clientSocket.id;
      game.lPlayerProfile = clientSocket['user_info'].user;
      this.games.set(roomName, game);
      clientSocket['waiting'] = 0;
      const interval: any = setInterval(() => {
        if (clientSocket['waiting'] === 10) {
          clientSocket.leave(roomName);
          clientSocket.emit('user_exit_room');
          clearInterval(this.waitingInterval.get(roomName));
        }
        clientSocket['waiting']++;
      }, 1000);
      this.waitingInterval.set(roomName, interval);
    } else {
      clearInterval(this.waitingInterval.get(roomName));
      game.rPlayerSocketId = clientSocket.id;
      game.rPlayerProfile = clientSocket['user_info'].user;
      this.server.to(`${roomName}`).emit('user_joined_room', {
        owner: game.lPlayerSocketId,
        lPlayerInfo: game.lPlayerProfile,
        rPlayerInfo: game.rPlayerProfile,
      });
    }
  }

  @SubscribeMessage('player_change_difficulty')
  playerChangeDifficulty(
    @ConnectedSocket() clientSocket: Socket,
    @Body() difficulty,
  ) {
    const roomName: string = clientSocket['room_name'];
    const game: Game = this.games.get(roomName);
    if (game === undefined) return;
    game.init(difficulty);
    this.server.to(`${roomName}`).emit('difficulty_changed', difficulty);
  }

  @SubscribeMessage('player_ready')
  async playerReady(@ConnectedSocket() clientSocket: Socket) {
    const roomName: string = clientSocket['room_name'];
    const game: Game = this.games.get(roomName);
    if (game === undefined) return;
    if (game.playerReady === undefined) {
      game.playerReady = clientSocket.id;
      this.server.to(`${roomName}`).emit('counterpart_ready', clientSocket.id);
    } else if (
      game.playerReady !== undefined &&
      game.playerReady !== clientSocket.id &&
      game.playerReady !== roomName
    ) {
      game.playerReady = roomName;
      try {
        const gameInfo = await this.matchHistoryService.createGameInfo(
          game.gameInfo(),
        );
        game.game_id = gameInfo.game_id;
      } catch (e) {
        clientSocket.emit('game_error', e);
        clientSocket.disconnect(true);
        return;
      }
      this.server
        .to(`${roomName}`)
        .emit('server_ready_to_start', game.renderInfo());
    }
  }

  @SubscribeMessage('client_ready_to_start')
  async clientReadyToStart(@ConnectedSocket() clientSocket: Socket) {
    const roomName: string = clientSocket['room_name'];
    const game: Game = this.games.get(roomName);
    if (game === undefined) return;
    if (game.renderReady === false) {
      game.renderReady = true;
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
    const roomName: string = clientSocket['room_name'];
    const game: Game = this.games.get(roomName);
    if (game === undefined) return;
    if (game.isRank === true && game.isSaveData === false) {
      game.isSaveData = true;
      game.finishGame();
      try {
        await this.updateGameResult(game);
      } catch (e) {
        clientSocket.emit('game_error', e);
        clientSocket.disconnect(true);
        return;
      }
      this.server.to(`${roomName}`).emit('saved_game_data');
    }
  }

  @SubscribeMessage('user_leave_room')
  async userLeaveRoom(@ConnectedSocket() clientSocket: Socket) {
    const roomName: string = clientSocket['room_name'];
    const game: Game = this.games.get(roomName);
    if (game === undefined) return;
    clientSocket.leave(roomName);
    let result;
    try {
      result = await this.matchHistoryService.readGameResult({
        game_id: game.game_id,
      });
    } catch (e) {
      clientSocket.emit('game_error', e);
      clientSocket.disconnect(true);
      return;
    }
    clientSocket.emit('game_result', result);
    this.games.delete(roomName);
  }

  @SubscribeMessage('up_key_pressed')
  keyDownBarUp(@ConnectedSocket() clientSocket: Socket) {
    const roomName: string = clientSocket['room_name'];
    const game: Game = this.games.get(roomName);
    if (game === undefined) return;

    if (clientSocket.id === game.lPlayerSocketId) {
      game.lPlayerInput('up', true);
    } else if (clientSocket.id === game.rPlayerSocketId) {
      game.rPlayerInput('up', true);
    }
  }

  @SubscribeMessage('down_key_pressed')
  keyDownBarDown(@ConnectedSocket() clientSocket: Socket) {
    const roomName: string = clientSocket['room_name'];
    const game: Game = this.games.get(roomName);
    if (game === undefined) return;

    if (clientSocket.id === game.lPlayerSocketId) {
      game.lPlayerInput('down', true);
    } else if (clientSocket.id === game.rPlayerSocketId) {
      game.rPlayerInput('down', true);
    }
  }

  @SubscribeMessage('up_key_released')
  keyUpBarUp(@ConnectedSocket() clientSocket: Socket) {
    const roomName: string = clientSocket['room_name'];
    const game: Game = this.games.get(roomName);
    if (game === undefined) return;
    if (clientSocket.id === game.lPlayerSocketId) {
      game.lPlayerInput('up', false);
    } else if (clientSocket.id === game.rPlayerSocketId) {
      game.rPlayerInput('up', false);
    }
  }

  @SubscribeMessage('down_key_released')
  keyUpBarDown(@ConnectedSocket() clientSocket: Socket) {
    const roomName: string = clientSocket['room_name'];
    const game: Game = this.games.get(roomName);
    if (game === undefined) return;

    if (clientSocket.id === game.lPlayerSocketId) {
      game.lPlayerInput('down', false);
    } else if (clientSocket.id === game.rPlayerSocketId) {
      game.rPlayerInput('down', false);
    }
  }

  async startGame(roomName: string) {
    const game: Game = this.games.get(roomName);
    if (game === undefined) return;
    this.playUserList.add(game.lPlayerProfile.user_id);
    this.playUserList.add(game.rPlayerProfile.user_id);
    const interval: any = setInterval(async () => {
      game.update();
      this.server.to(`${roomName}`).emit('game_render_data', game.renderData());
      if (game.isFinished === true) {
        this.server.to(`${roomName}`).emit('game_finished');
        this.playUserList.delete(game.lPlayerProfile.user_id);
        this.playUserList.delete(game.rPlayerProfile.user_id);
        clearInterval(this.renderInterval.get(roomName));
      }
    }, (1 / FPS) * 1000);
    this.renderInterval.set(roomName, interval);
  }

  async updateGameResult(game: Game) {
    const rankInfo: any = game.changeRankInfo();
    try {
      await this.matchHistoryService.createGameResult(game.gameResult());
      await this.matchHistoryService.createRankHistory(rankInfo.l_player);
      await this.matchHistoryService.createRankHistory(rankInfo.r_player);
    } catch (e) {
      throw new WsException(e);
    }
  }

  async bindUser(clientSocket: Socket) {
    const access_token: string = clientSocket.handshake.auth['access_token'];
    let user: any;
    try {
      user = await this.authService.verifyJwt(access_token);
    } catch (e) {
      throw new WsException(e);
    }
    clientSocket['user_info'] = { user, waiting: 0 };
    return user;
  }

  async updateUser(clientSocket: Socket) {
    if (clientSocket['user_info'] === undefined) {
      try {
        await this.bindUser(clientSocket);
      } catch (e) {
        throw new WsException(e);
      }
    }
    const nickname: string = clientSocket['user_info'].user.nickname;
    let user: any;
    try {
      user = await this.userService.readUserByNickname(nickname);
    } catch (e) {
      throw new WsException(e);
    }
    delete user.created;
    delete user.deleted;
    clientSocket['user_info'] = { user, waiting: 0 };
  }

  checkUserList(userId: string, clientSocketId: string) {
    const findUserSocketId = this.clients.get(userId);
    if (findUserSocketId !== undefined) {
      const findUserSocket = this.server.sockets.sockets.get(findUserSocketId);
      try {
        findUserSocket.emit('game_error', 'The same user logged in.');
        findUserSocket.disconnect(true);
      } catch (e) {}
      this.clients.delete(userId);
    }
    this.clients.set(userId, clientSocketId);
  }
}
