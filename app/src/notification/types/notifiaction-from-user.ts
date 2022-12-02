import { UserProfile } from '../../user/types/user-profile';
import { NotificationFormat } from './notification.format';

export class NotificationFromUser implements NotificationFormat {
  type: string;
  data: {
    sender: UserProfile;
    payload: any;
  };

  constructor(
    type: string,
    data: {
      sender: UserProfile;
      payload: any;
    },
  ) {
    this.type = type;
    this.data = data;
  }
}
