import 'dotenv/config';
import postgres from '@prisma/orm-postgres/runtime';
import type { Contract } from './contract.js';
import contractJson from './contract.json' with { type: 'json' };

export function createDatabase() {
  const url = process.env['DATABASE_URL'];
  if (!url) throw new Error('DATABASE_URL is required');

  return postgres<Contract>({ contractJson, url });
}
