import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

/*
 @ routing key will be event type
 @ ex) event.on.<service name>.<event type>[.additional.param].rk
 */
export class RmqEvent {
  @IsString({ each: true })
  recvUsers: string[];

  @IsNotEmpty()
  payload: any;

  @IsDateString()
  created: Date;

  constructor(payload, recvUsers: string[] = null) {
    this.payload = payload;
    this.recvUsers = recvUsers;
    this.created = new Date();
  }
}
