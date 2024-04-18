import { ConsolaInstance, createConsola, LogLevel, LogLevels } from 'consola';
import { JsonObject, logging } from '@angular-devkit/core';
import { filter } from 'rxjs';
import { ProcessOutput } from '@angular-devkit/core/node';

export type LoggerInstance = ConsolaInstance;

export class Logger {
  private static instance: LoggerInstance;

  private constructor(verbose?: boolean) {
    Logger.instance = createConsola({
      level: verbose ? LogLevels.verbose : LogLevels.log,
    });
  }

  public static getInstance(verbose?: boolean): LoggerInstance {
    if (!Logger.instance) {
      new Logger(verbose);
    }
    return Logger.instance;
  }
}

export function createConsolaLogger(
  verbose?: boolean,
  stdout: ProcessOutput = process.stdout,
  stderr: ProcessOutput = process.stderr,
  colors?: Partial<Record<logging.LogLevel, (s: string) => string>>
) {
  const logger = new ConsolaLogger('consola', verbose);
  logger.pipe(filter((entry) => !!verbose)).subscribe((entry) => {
    const color = colors && colors[entry.level];
    let output = stdout;

    switch (entry.level) {
      case 'warn':
      case 'fatal':
      case 'error':
        output = stderr;
        break;
    }

    const chunkSize = 2000; // Small chunk.
    let message = entry.message;
    while (message) {
      const chunk = message.slice(0, chunkSize);
      message = message.slice(chunkSize);
      output.write(color ? color(chunk) : chunk);
    }
    output.write('\n');
  });

  return logger;
}

export class ConsolaLogger extends logging.Logger {
  private consolaInstance: ConsolaInstance;
  constructor(
    name: string,
    verbose = false,
    parent: logging.Logger | null = null
  ) {
    super(name, parent);
    this.consolaInstance = createConsola({
      level: verbose ? LogLevels.verbose : LogLevels.log,
    });
  }

  override info(message: string, metadata?: JsonObject) {
    this.consolaInstance.info(message, metadata);
  }

  override debug(message: string, metadata?: JsonObject) {
    this.consolaInstance.debug(message, metadata);
  }

  override warn(message: string, metadata?: JsonObject) {
    this.consolaInstance.warn(message, metadata);
  }

  override error(message: string, metadata?: JsonObject) {
    this.consolaInstance.error(message, metadata);
  }

  override fatal(message: string, metadata?: JsonObject) {
    this.consolaInstance.fatal(message, metadata);
  }
}
