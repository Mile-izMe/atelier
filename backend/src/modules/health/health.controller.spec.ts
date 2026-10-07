import { jest } from '@jest/globals';
import { Test } from '@nestjs/testing';
import { CustomLogger } from '#app/libs/logger/logger.service';
import { HealthController } from './health.controller.js';

describe('HealthController', () => {
  it('returns liveness status and logs the check', async () => {
    const logger = { debug: jest.fn() };
    const module = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: CustomLogger, useValue: logger }],
    }).compile();

    try {
      const controller = module.get(HealthController);
      expect(controller.live()).toEqual({ status: 'ok' });
      expect(logger.debug).toHaveBeenCalledWith(
        'Liveness check passed',
        HealthController.name,
      );
    } finally {
      await module.close();
    }
  });
});
