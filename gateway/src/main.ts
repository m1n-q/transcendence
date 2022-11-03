import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import * as cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.use(cookieParser());
  app.enableCors();
  const port = process.env.PORT || 3001;
  await app.listen(port, () => {
    console.log(`Server on ${port}`);
  });
}
bootstrap();
