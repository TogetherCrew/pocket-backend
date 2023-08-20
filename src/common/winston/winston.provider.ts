import { Inject, Injectable, LoggerService } from '@nestjs/common';
import { MODULE_OPTIONS_TOKEN } from './winston.module-definition';
import { Logger, LoggerOptions, createLogger } from 'winston';
import { WinstonLevel } from './types/common.type';

@Injectable()
export class WinstonProvider implements LoggerService {
  private logger: Logger;
  private readonly levels: WinstonLevel[] = [
    'debug',
    'error',
    'info',
    'verbose',
    'warn',
  ];

  constructor(@Inject(MODULE_OPTIONS_TOKEN) readonly options: LoggerOptions) {
    this.logger = createLogger(options);
  }

  private appendContextIntoMeta(
    contextOrMeta: string | Record<string, any>,
    metadata: Record<string, any>,
  ) {
    return typeof contextOrMeta === 'object'
      ? contextOrMeta
      : { context: contextOrMeta, ...metadata };
  }

  log(
    message: string,
    context?: string,
    metadata?: Record<string, any>,
  ): Logger;
  log(
    level: WinstonLevel,
    message: string,
    metadata?: Record<string, any>,
  ): Logger;
  log(
    messageOrLevel: string | WinstonLevel,
    messageOrContext?: string,
    metadata?: Record<string, any>,
  ): Logger {
    if (this.levels.includes(messageOrLevel.toLowerCase() as WinstonLevel)) {
      return this.logger.log(messageOrLevel, messageOrContext, metadata);
    } else {
      return this.logger.info(
        messageOrLevel,
        this.appendContextIntoMeta(messageOrContext, metadata),
      );
    }
  }

  error(message, context?: string, metadata?: Record<string, any>);
  error(message: string, metadata?: Record<string, any>);
  error(
    message: string,
    contextOrMetadata?: string | Record<string, any>,
    metadata?: Record<string, any>,
  ): Logger {
    return this.logger.error(
      message,
      this.appendContextIntoMeta(contextOrMetadata, metadata),
    );
  }

  warn(message, context?: string, metadata?: Record<string, any>);
  warn(message: string, metadata?: Record<string, any>);
  warn(
    message: string,
    contextOrMetadata?: string | Record<string, any>,
    metadata?: Record<string, any>,
  ): Logger {
    return this.logger.warn(
      message,
      this.appendContextIntoMeta(contextOrMetadata, metadata),
    );
  }

  debug(message, context?: string, metadata?: Record<string, any>);
  debug(message: string, metadata?: Record<string, any>);
  debug(
    message: string,
    contextOrMetadata?: string | Record<string, any>,
    metadata?: Record<string, any>,
  ): Logger {
    return this.logger.debug(
      message,
      this.appendContextIntoMeta(contextOrMetadata, metadata),
    );
  }

  verbose(message, context?: string, metadata?: Record<string, any>);
  verbose(message: string, metadata?: Record<string, any>);
  verbose(
    message: string,
    contextOrMetadata?: string | Record<string, any>,
    metadata?: Record<string, any>,
  ): Logger {
    return this.logger.verbose(
      message,
      this.appendContextIntoMeta(contextOrMetadata, metadata),
    );
  }
}
