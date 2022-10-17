import { IsDateString, IsNotEmpty, IsString } from 'class-validator';

export class RmqEvent {
  @IsNotEmpty()
  payload: any;

  @IsString()
  publisher: string;

  @IsDateString()
  created: Date;
}
