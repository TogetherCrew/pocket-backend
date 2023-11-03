import { Module } from '@nestjs/common';
import { RetrieveModule } from './retrieve/retrieve.module';
import { AnalyticsModule } from './analytics/analytics.module';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { WinstonModule } from '@common/winston/winston.module';
import { format } from 'winston';
import LokiTransport from 'winston-loki';
import { winstonConsoleTransport } from '@common/winston/winston.utils';
import { APP_FILTER } from '@nestjs/core';
import { AllExceptionsFilter } from '@common/filters/all-exception.filter';
import { DatabaseModule } from '@common/database/database.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    WinstonModule.forRootAsync({
      useFactory: (config: ConfigService) => {
        const grafanaServiceName = config.get<string>('GRAFANA_SERVICE_NAME');

        return {
          level: config.get<string>('DEBUG_MODE') === 'true' ? 'debug' : 'info',
          format: format.combine(
            format.ms(),
            format.timestamp(),
            format.json(),
          ),
          transports:
            config.get<string>('NODE_ENV') === 'production'
              ? [
                  new LokiTransport({
                    host: config.get<string>('GRAFANA_LOKI_HOST'),
                    format: format.json(),
                    labels: {
                      'service-name':
                        grafanaServiceName?.length > 0
                          ? grafanaServiceName
                          : 'pocket-backend',
                    },
                  }),
                  winstonConsoleTransport,
                ]
              : [winstonConsoleTransport],
        };
      },
      inject: [ConfigService],
    }),
    DatabaseModule.forRoot(),
    RetrieveModule,
    AnalyticsModule,
  ],
  providers: [
    {
      provide: APP_FILTER,
      useClass: AllExceptionsFilter,
    },
  ],
})
export class AppModule {}
