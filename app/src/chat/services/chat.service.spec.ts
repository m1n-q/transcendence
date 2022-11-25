import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';
import { ChatRoomBanList } from '../../common/entities/chat-room-ban-list.entity';
import { ChatRoomMessage } from '../../common/entities/chat-room-message.entity';
import { ChatRoomMuteList } from '../../common/entities/chat-room-mute-list.entity';
import { ChatRoomUser } from '../../common/entities/chat-room-user.entity';
import {
  ChatRoom,
  ChatRoomAccess,
} from '../../common/entities/chat-room.entity';
import { ChatService } from './chat.service';

class MockChatRoomRepository {}
class MockChatRoomMessageRepository {}
class MockChatRoomUserRepository {}
class MockChatRoomBanListRepository {}
class MockChatRoomMuteListRepository {}

type QueryRunner = {
  manager;
  startTransaction;
  commitTransaction;
  rollbackTransaction;
  release;
};
const qr = {
  manager: {},
  startTransaction: jest.fn(),
  commitTransaction: jest.fn(),
  rollbackTransaction: jest.fn(),
  release: jest.fn(),
};

class ConnectionMock {
  createQueryRunner(mode?: 'master' | 'slave'): QueryRunner {
    return qr;
  }
}

describe('ChatService', () => {
  let chatService: ChatService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        ChatService,
        {
          provide: getRepositoryToken(ChatRoom),
          useClass: MockChatRoomRepository,
        },
        {
          provide: getRepositoryToken(ChatRoomMessage),
          useClass: MockChatRoomRepository,
        },
        {
          provide: getRepositoryToken(ChatRoomUser),
          useClass: MockChatRoomRepository,
        },
        {
          provide: getRepositoryToken(ChatRoomBanList),
          useClass: MockChatRoomRepository,
        },
        {
          provide: getRepositoryToken(ChatRoomMuteList),
          useClass: MockChatRoomRepository,
        },
        {
          provide: DataSource,
          useClass: ConnectionMock,
        },
      ],
    }).compile();

    chatService = module.get<ChatService>(ChatService);
  });

  describe('findRoom', () => {
    it('should return an ChatRoom instance', async () => {
      const result: ChatRoom = {
        roomId: '',
        roomName: 'test',
        roomAccess: ChatRoomAccess.PUBLIC,
        roomOwnerId: '',
        roomPassword: '',
        created: '',
        roomOwner: null,
        messages: null,
      };
      jest
        .spyOn(chatService, 'findRoom')
        .mockImplementation(async () => result);

      expect(await chatService.findRoom('')).toBe(result);
    });
  });
});
