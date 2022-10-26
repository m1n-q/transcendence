import { Controller } from '@nestjs/common';
import { RabbitSubscribe } from '@golevelup/nestjs-rabbitmq';
import { AppService } from './app.service';

@Controller()
export class AppRmqController {
  constructor(private readonly appService: AppService) {}
}
