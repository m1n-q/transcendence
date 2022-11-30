import { AmqpConnection } from '@golevelup/nestjs-rabbitmq';
import { Injectable } from '@nestjs/common';
import { RmqEvent } from '../../common/rmq/types/rmq-event';

/*
 *
 * 각 서비스에서 발행된 이벤트를 수집하여,
 * event.on.notification.${evType}.${recv}.rk
 * 형태로 웹소켓에 전달
 *
 */

// - [ ] DM (DM Gateway)
// - [ ] 접속상태 (User-service || Auth-service)
// - [x] 친구 신청 (User-service)
// - [ ] 게임 초대 (Game-service?)
// - [ ] 채팅 초대 (Chat-service)

// RmqEvent의 recvUser 프로퍼티는
// 현재 User-Service -> Notification-Service 에서만 이용되는 것 같음.
// ex ) A dm to B..
// publish(event.on.dm.A:B.rk) -> recvUser 이용 X...
// 어잠만, user service는, 라우팅키 접근 못해서 이렇게 했던거 아닌가?
// noti server는 이를 구독하고 있어야함?!!
// 흠 ... 알림용 이벤트를 별도로 지정할까
// 아냐아냐, 애초에 설계를 이렇게 한게, 이벤트가 발생하면 노티는 캐치만 해갈수 있고
// 다른애들은 신경안써도되게 하려는거 아님?
//
// 만약 발생하면, publish ( event.on.notifiaction.new-dm.recvUser.rk)
//
//
// 마지막 전송되기 전까지만 recvUsers 유지, 이후 No RmqEvent?

@Injectable()
export class NotificationService {
  constructor(private readonly amqpConnection: AmqpConnection) {}

  userEventHandler(ev: RmqEvent, rk: string) {
    const re = /(?<=event.on.user.)(.*)(?=.rk)/;
    const evType = re.exec(rk)[0];

    switch (evType) {
      case 'friend-request':
        break;
      default:
        console.log('unknown event');
        return;
    }

    for (const recvUser of ev.recvUsers) {
      const userRk = `event.on.notification.${evType}.${recvUser}.rk`;
      const event = new RmqEvent(ev.payload, [recvUser]);

      this.amqpConnection.publish(
        process.env.RMQ_NOTIFICATION_TOPIC,
        userRk,
        event,
      );
    }
  }

  dmEventHandler(ev: RmqEvent, rk: string) {
    const re = /(?<=event.on.dm.)(.*)(?=.rk)/;
    const parsed = re.exec(rk)[0].split('.');
    const params = { evType: parsed[0], dmRoomName: parsed[1] };
    const users = params.dmRoomName.split(':');

    switch (params.evType) {
      case 'message' /* only if user not in dm websocket, */:
        break;
      default:
        console.log('unknown event');
        return;
    }

    for (const recvUser of ev.recvUsers) {
      const userRk = `event.on.notification.${params.evType}.${recvUser}.rk`;
      const event = new RmqEvent(ev.payload, [recvUser]);

      this.amqpConnection.publish(
        process.env.RMQ_NOTIFICATION_TOPIC,
        userRk,
        event,
      );
    }
  }

  chatRoomEventHandler(ev: RmqEvent, rk: string) {
    const re = /(?<=event.on.dm.)(.*)(?=.rk)/;
    const evType = re.exec(rk)[0];

    switch (evType) {
      case 'friend-request':
        break;
      default:
        console.log('unknown event');
        return;
    }

    for (const recvUser of ev.recvUsers) {
      const userRk = `event.on.notification.${evType}.${recvUser}.rk`;
      const event = new RmqEvent(ev.payload, [recvUser]);

      this.amqpConnection.publish(
        process.env.RMQ_NOTIFICATION_TOPIC,
        userRk,
        event,
      );
    }
  }
}
