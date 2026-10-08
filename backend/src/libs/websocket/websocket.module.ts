import { AuthModule } from '#app/modules/auth/auth.module';
import { Module } from '@nestjs/common';
import { EventsGateway } from './events.gateway.js';
import { WebsocketModuleClass } from './websocket.module-definition.js';
import { WebsocketService } from './websocket.service.js';
import { UserModule } from '#app/modules/user/user.module';

@Module({
  imports: [AuthModule, UserModule],
  providers: [EventsGateway, WebsocketService],
  exports: [EventsGateway],
})
export class WebsocketModule extends WebsocketModuleClass {}
