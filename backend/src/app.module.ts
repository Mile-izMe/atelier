import { LogLevel } from '#app/libs/logger/enums/logger.enum';
import { LoggerModule } from '#app/libs/logger/logger.module';
import { HealthModule } from '#app/modules/health/health.module';
import {
  Module,
  type MiddlewareConsumer,
  type NestModule,
  RequestMethod,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core';
import { GlobalExceptionFilter } from './libs/exceptions/global-exception.filter.js';
import { ApiSuccessInterceptor } from './libs/interceptors/success-response.interceptor.js';
import { WebsocketModule } from './libs/websocket/websocket.module.js';
import { ApiValidationPipe } from './libs/exceptions/api-validation.pipe.js';
import { RequestContextMiddleware } from './libs/request-context/request-context.middleware.js';

@Module({
  imports: [
    LoggerModule.forRoot({
      logLevel: LogLevel.DEBUG,
      prefix: 'atelier',
      saveToFile: false,
    }),

    WebsocketModule.forRoot({
      roomPrefix: 'atelier',
    }),

    // Module
    HealthModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ApiValidationPipe },
    {
      provide: APP_INTERCEPTOR,
      useClass: ApiSuccessInterceptor,
    },
    {
      provide: APP_FILTER,
      useClass: GlobalExceptionFilter,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestContextMiddleware).forRoutes({
      path: '{*path}',
      method: RequestMethod.ALL,
    });
  }
}
