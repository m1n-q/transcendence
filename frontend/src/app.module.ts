import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { Oauth42Guard } from './oauth2.guard';
import { Oauth42Strategy } from './oauth2.strategy';

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath: ['src/.key'],
    }),
  ],
  controllers: [AppController, AuthController],
  providers: [AuthService, Oauth42Guard, Oauth42Strategy],
})
export class AppModule {}
