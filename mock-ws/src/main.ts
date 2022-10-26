import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);
  const PORT = parseInt(process.env.SERVER_PORT);

  app.useStaticAssets(__dirname + '/../static');
  app.setBaseViewsDir(__dirname + '/../views');
  app.setViewEngine('hbs'); //* set template engine
  await app.listen(PORT, () => console.log(`ws-server on ${PORT}`));
}
bootstrap();
