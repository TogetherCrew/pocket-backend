import { Module } from '@nestjs/common';
import { WinstonProvider } from './winston.provider';
import {
  ConfigurableModuleClass,
  MODULE_OPTIONS_TOKEN,
} from './winston.module-definition';
import { LoggerOptions, createLogger } from 'winston';
import { WINSTON_LOGGER } from './winston.constant';

@Module({
  providers: [
    {
      provide: WINSTON_LOGGER,
      useFactory: (options: LoggerOptions) => {
        return createLogger(options);
      },
      inject: [MODULE_OPTIONS_TOKEN],
    },
    WinstonProvider,
  ],
  exports: [WinstonProvider],
})
export class WinstonModule extends ConfigurableModuleClass {}
