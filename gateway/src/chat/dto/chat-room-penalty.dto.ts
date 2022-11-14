import { Expose } from 'class-transformer';
import { IsNumber, IsString } from 'class-validator';

export class ChatRoomPenaltyDto {
  @Expose()
  @IsString()
  roomId: string;

  @Expose()
  @IsString()
  roomAdminId: string;

  @Expose()
  @IsString()
  userId: string;

  @Expose()
  @IsNumber()
  time_amount_in_seconds: number;
}
