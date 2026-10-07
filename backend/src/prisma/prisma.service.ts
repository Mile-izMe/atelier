import { Injectable, type OnModuleDestroy } from '@nestjs/common';
import { createDatabase } from './db.js';

@Injectable()
export class PrismaService implements OnModuleDestroy {
  private readonly client = createDatabase();
  readonly orm: ReturnType<typeof createDatabase>['orm'] = this.client.orm;

  async onModuleDestroy(): Promise<void> {
    await this.client.close();
  }
}
