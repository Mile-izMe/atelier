import { LogLevel } from '#app/libs/logger/enums/logger.enum';

export interface LoggerOptions {
  logLevel: LogLevel;
  prefix?: string;
  saveToFile?: boolean;
  discordWebhookUrl?: string;
}
