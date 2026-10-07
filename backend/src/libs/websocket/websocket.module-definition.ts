import { ConfigurableModuleBuilder } from '@nestjs/common';
import { WebsocketOptions } from './interface/websocket.interface.js';

export const {
  ConfigurableModuleClass: WebsocketModuleClass,
  MODULE_OPTIONS_TOKEN: WEBSOCKET_OPTIONS,
} = new ConfigurableModuleBuilder<WebsocketOptions>()
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
