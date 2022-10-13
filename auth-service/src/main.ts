import { NestFactory } from '@nestjs/core';
import { AuthModule } from './auth-module/auth.module';
import * as cookieParser from 'cookie-parser';
async function bootstrap() {
  const app = await NestFactory.create(AuthModule);
  app.use(cookieParser());
  console.log(`Server on ${process.env.PORT}`);
  await app.listen(process.env.PORT);
}
bootstrap();
