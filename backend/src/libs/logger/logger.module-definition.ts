import { ConfigurableModuleBuilder } from '@nestjs/common';
import { LoggerOptions } from '#app/libs/logger/interface/logger.interface';

export const {
  ConfigurableModuleClass: LoggerModuleClass,
  MODULE_OPTIONS_TOKEN: LOGGER_OPTIONS,
} = new ConfigurableModuleBuilder<LoggerOptions>()
  .setClassMethodName('forRoot')
  .setExtras(
    {
      isGlobal: true,
    },
    (definition, extras) => ({
      ...definition,
      global: extras.isGlobal,
    }),
  )
  .build();
