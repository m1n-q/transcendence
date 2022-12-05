import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';

async function bootstrap() {
  process.on('unhandledRejection', (error) => {
    console.error(error); // This prints error with stack included (as for normal errors)
    throw error; // Following best practices re-throw error and let the process exit with error code
  });

  const app = await NestFactory.create(AppModule);
  const PORT = parseInt(process.env.SERVER_PORT);

  await app.listen(PORT, () => console.log(`ws-server on ${PORT}`));
}
bootstrap();
