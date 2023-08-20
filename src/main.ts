import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonProvider } from '@common/winston/winston.provider';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  app.useLogger(app.get(WinstonProvider));
  await app.listen(3000);
}
bootstrap();
