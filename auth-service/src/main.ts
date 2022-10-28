import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth-module/auth.module';
import { NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AuthModule);
  app.use(cookieParser());
  app.setBaseViewsDir(join(__dirname, '..', 'views'));
  app.setViewEngine('hbs');
  console.log(`Server on ${process.env.PORT}`);
  await app.listen(process.env.PORT);
}
bootstrap();
