import { Module } from '@nestjs/common';
import { WebsocketModuleClass } from './websocket.module-definition.js';

@Module({
  providers: [],
  exports: [],
})
export class WebsocketModule extends WebsocketModuleClass {}
