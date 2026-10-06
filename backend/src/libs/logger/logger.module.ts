import { Module } from '@nestjs/common';
import { LoggerModuleClass } from './logger.module-definition.js';
import { CustomLogger } from './logger.service.js';

@Module({
  providers: [CustomLogger],
  exports: [CustomLogger],
})
export class LoggerModule extends LoggerModuleClass {}
