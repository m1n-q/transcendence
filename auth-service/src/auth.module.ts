import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AuthHttpController } from './auth.http.controller';
import { AuthService } from './auth.service';
import { RedisModule } from './redis/redis.module';
import { JwtAccessGuard, JwtRefreshGuard } from './jwt/jwt.guard';
import { JwtAccessStrategy, JwtRefreshStrategy } from './jwt/jwt.strategy';
import {
  Oauth42Guard,
  OauthGoogleGuard,
  OauthKakaoGuard,
} from './oauth2/oauth2.guard';
import {
  Oauth42Strategy,
  OauthGoogleStrategy,
  OauthKakaoStrategy,
} from './oauth2/oauth2.strategy';
import { RmqModule } from './rmq/rmq.module';
import { RmqService } from './rmq/services/rmq.service';
import { UserFinderService } from './user-finder/user-finder.service';
import { RabbitMQModule } from '@golevelup/nestjs-rabbitmq';
import { RmqResponseInterceptor } from './rmq-response.interceptor';
import { AuthRmqController } from './auth.rmq.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['src/jwt/.key', 'src/oauth2/.key', '.env'],
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
    Oauth42Strategy,
    Oauth42Guard,
    OauthGoogleStrategy,
    OauthGoogleGuard,
    OauthKakaoStrategy,
    OauthKakaoGuard,
    AuthService,
    RmqService,
    UserFinderService,
    AuthRmqController,
    RmqResponseInterceptor,
  ],
  exports: [JwtAccessGuard, JwtRefreshGuard, Oauth42Guard, OauthGoogleGuard],
  controllers: [AuthHttpController, AuthRmqController],
})
export class AuthModule {}
