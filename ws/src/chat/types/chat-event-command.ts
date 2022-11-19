import { RmqEvent } from '../../common/rmq/types/rmq-event';
import { ChatGateway } from '../chat.gateway';
import { ChatAnnouncementFromServer } from './chat-message-format';

export type RoutingKeyParams = { evType: string; roomId: string };
export interface EventCommand {
  ev: RmqEvent;
  params: RoutingKeyParams;

  execute(chatGateway: ChatGateway);
}

export class BanCommand implements EventCommand {
  ev: RmqEvent;
  params: RoutingKeyParams;
  constructor(ev: RmqEvent, params: RoutingKeyParams) {
    this.ev = ev;
    this.params = params;
  }
  async execute(chatGateway: ChatGateway) {
    const userId = this.ev.recvUsers[0];
    const sockId = await chatGateway.getConnSocketId(userId);
    const clientSocket = chatGateway.getClientSocket(sockId);
    if (clientSocket) {
      chatGateway.announce(
        clientSocket,
        new ChatAnnouncementFromServer(this.ev.payload),
      );
      clientSocket.leave(this.params.roomId);
      clientSocket.disconnect(true);
    }
  }
}

export class AnnouncementCommand implements EventCommand {
  ev: RmqEvent;
  params: RoutingKeyParams;
  constructor(ev: RmqEvent, params: RoutingKeyParams) {
    this.ev = ev;
    this.params = params;
  }
  async execute(chatGateway: ChatGateway) {
    chatGateway.announce(
      chatGateway.getServer().in(this.params.roomId),
      new ChatAnnouncementFromServer(this.ev.payload),
    );
  }
}

export class MessageCommand implements EventCommand {
  ev: RmqEvent;
  params: RoutingKeyParams;
  constructor(ev: RmqEvent, params: RoutingKeyParams) {
    this.ev = ev;
    this.params = params;
  }
  async execute(chatGateway: ChatGateway) {
    const clientSockets: any[] = await chatGateway
      .getServer()
      .in(this.params.roomId)
      .fetchSockets();
    /* handle room message from other instances */
    const senderId = this.ev.payload['sender']['user_id'];
    for (const clientSocket of clientSockets) {
      if (chatGateway.getUser(clientSocket).user_id == senderId)
        chatGateway.echoMessage(clientSocket, this.ev.payload);
      else chatGateway.sendMessage(clientSocket, this.ev.payload);
    }
  }
}

export class CommandFactory {
  getCommand(ev: RmqEvent, params: RoutingKeyParams): EventCommand {
    switch (params.evType) {
      case 'message':
        return new MessageCommand(ev, params);
      case 'announcement':
        return new AnnouncementCommand(ev, params);
      case 'ban':
        return new BanCommand(ev, params);
      default:
        return null;
    }
  }
}
