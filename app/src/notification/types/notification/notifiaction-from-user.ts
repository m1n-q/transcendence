import { NotificationFormat } from './notification.format';

export class NotificationFromUser implements NotificationFormat {
  type: string;
  sender: any;
  payload: string;

  constructor(type: string, sender: any, payload: string) {
    this.type = type;
    this.sender = sender;
    this.payload = payload;
  }
}
