import { UserProfile } from '../../user/types/user-profile';
import { NotificationFormat } from './notification.format';

export class NotificationFromUser implements NotificationFormat {
  type: string;
  sender: UserProfile;
  payload: string;

  constructor(type: string, sender: UserProfile, payload: string) {
    this.type = type;
    this.sender = sender;
    this.payload = payload;
  }
}
