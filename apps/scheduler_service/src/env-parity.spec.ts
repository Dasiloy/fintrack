import { readFileSync } from 'fs';
import { join } from 'path';

const requiredEnvKeys = [
  'MICROSERVICE_NAME',
  'SCHEDULER_SERVICE_HOST',
  'SCHEDULER_SERVICE_PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'DB_POOL_MAX',
];

const prodOnlyEnvKeys = ['NODE_ENV', 'DATABASE_CA_CERTIFICATE'];

function readEnvKeys(relativePath: string): Set<string> {
  const source = readFileSync(join(__dirname, '..', relativePath), 'utf8');
  return new Set(
    source
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => /^[A-Z][A-Z0-9_]*=/.test(line))
      .map((line) => line.split('=')[0]),
  );
}

describe('Scheduler service environment files', () => {
  it.each(['.env', '.env.example'])(
    '%s includes every local scheduler env key',
    (fileName) => {
      const keys = readEnvKeys(fileName);

      expect([...keys].sort()).toEqual([...requiredEnvKeys].sort());
    },
  );

  it('keeps NODE_ENV and certificate configuration prod-only', () => {
    const keys = readEnvKeys('.env.prod');

    expect([...keys].sort()).toEqual(
      [...requiredEnvKeys, ...prodOnlyEnvKeys].sort(),
    );
  });

  it('validates every required runtime key in SchedulerModule', () => {
    const source = readFileSync(join(__dirname, 'scheduler.module.ts'), 'utf8');

    for (const key of requiredEnvKeys) {
      expect(source).toContain(`${key}: Joi.string()`);
    }

    expect(source).toContain('NODE_ENV: Joi.string().optional()');
  });
});
