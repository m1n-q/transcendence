import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

/*
 @ routing key will be event type
 @ ex) user.event.friend-request.rk
 */
export class RmqEvent {
  @IsString({ each: true })
  recvUsers: string[];

  @IsNotEmpty()
  payload: any;

  @IsDateString()
  created: Date;
}
