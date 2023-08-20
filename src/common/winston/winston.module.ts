import { Module } from '@nestjs/common';
import { WinstonProvider } from './winston.provider';
import { ConfigurableModuleClass } from './winston.module-definition';

@Module({
  providers: [WinstonProvider],
  exports: [WinstonProvider],
})
export class WinstonModule extends ConfigurableModuleClass {}
