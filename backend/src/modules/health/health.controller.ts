import { Controller, Get } from '@nestjs/common';
import { CustomLogger } from '#app/libs/logger/logger.service';

@Controller('health')
export class HealthController {
  constructor(private readonly logger: CustomLogger) {}

  @Get('live')
  live() {
    this.logger.debug('Liveness check passed', HealthController.name);

    return { status: 'ok' };
  }
}
