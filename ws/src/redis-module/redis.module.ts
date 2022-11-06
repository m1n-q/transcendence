import { Module } from '@nestjs/common';
import { RedisService } from './services/redis.service';
import * as redis from 'redis';
import { ConfigModule } from '@nestjs/config';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: '.env',
    }),
  ],

  /*
    DI for external library
    See https://docs.nestjs.com/fundamentals/custom-providers
  */
  providers: [
    RedisService,
    {
      provide: 'REDIS_CLIENT',
      useValue: redis.createClient({
        socket: {
          host: process.env.REDIS_HOST,
          port: Number(process.env.REDIS_PORT),
        },
      }),
    },
  ],
  exports: [RedisService],
})
export class RedisModule {}
