import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { WinstonProvider } from '@common/winston/winston.provider';
import { ConfigService } from '@nestjs/config';
import { map } from 'lodash';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bufferLogs: true });
  const configService = app.get<ConfigService>(ConfigService);
  const configuredOrigins = configService
    .get<string>('CORS_ORIGINS')
    .split(/\s*,\s*/);

  const origins = map(
    configuredOrigins?.length > 0 ? configuredOrigins : undefined,
    (origin) => {
      if (origin.startsWith('/') && origin.endsWith('/')) {
        return new RegExp(origin);
      } else {
        return origin;
      }
    },
  );

  app.enableCors({
    origin: origins.length > 0 ? origins : false,
    methods: ['GET', 'HEAD'],
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  app.useLogger(app.get(WinstonProvider));

  await app.listen(3000);
}
bootstrap();
