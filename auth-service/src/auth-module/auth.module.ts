import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthHttpController } from './controllers/auth.http.controller';
import { AuthService } from './services/auth.service';
import { RedisModule } from '../redis-module/redis.module';
import { JwtAccessGuard, JwtRefreshGuard } from '../jwt/jwt.guard';
import { JwtAccessStrategy, JwtRefreshStrategy } from '../jwt/jwt.strategy';
import {
  Oauth42Guard,
  OauthGoogleGuard,
  OauthKakaoGuard,
} from '../oauth2/oauth2.guard';
import {
  Oauth42Strategy,
  OauthGoogleStrategy,
  OauthKakaoStrategy,
} from '../oauth2/oauth2.strategy';
import { RmqModule } from '../rmq-module/rmq.module';
import { RmqService } from '../rmq-module/services/rmq.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqResponseInterceptor } from '../interceptors/rmq-response.interceptor';
import { AuthRmqController } from './controllers/auth.rmq.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['.jwt.key', '.oauth2.key', '.env'],
    }),
    PassportModule.register({}),
    JwtModule.register({}),
    RmqModule /* producer module */,
    RedisModule,
    RabbitMQModule.forRoot(RabbitMQModule, {
      uri: process.env.RMQ_HOST,
      exchanges: [
        {
          name: 'auth.d.x',
          type: 'direct',
        },
      ],
      enableControllerDiscovery: true,
    }),
  ],
  providers: [
    JwtAccessStrategy,
    JwtRefreshStrategy,
    JwtAccessGuard,
    JwtRefreshGuard,
    AuthService,
    RmqService,
    AuthRmqController,
    RmqResponseInterceptor,
  ],
  exports: [JwtAccessGuard, JwtRefreshGuard],
  controllers: [AuthHttpController, AuthRmqController],
})
export class AuthModule {}
