import { Body, Controller, Post } from '@nestjs/common';
import { RmqService } from './rmq/rmq.service';

//XXX: testing publisher
@Controller()
export class TempController {
  constructor(private readonly rmqClient: RmqService) {}

  @Post()
  sendMessage(@Body() b) {
    const rk = b['rk'];
    const msg = b['msg'];
    this.rmqClient.sendMessage(process.env.RMQ_USER_TOPIC, rk, msg);
  }
}
