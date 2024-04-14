import { ConsolaInstance, createConsola, LogLevels } from 'consola';

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
