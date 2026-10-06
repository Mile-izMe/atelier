import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { LogLevel } from '#app/libs/logger/enums/logger.enum';
import { LoggerModule } from '#app/libs/logger/logger.module';
import { HealthModule } from '#app/modules/health/health.module';

@Module({
  imports: [
    LoggerModule.forRoot({
      logLevel: LogLevel.DEBUG,
      prefix: 'atelier',
      saveToFile: false,
    }),

    // Module
    HealthModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
