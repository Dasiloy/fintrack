import { readFileSync } from 'fs';
import { join } from 'path';

const requiredEnvKeys = [
  'MICROSERVICE_NAME',
  'NOTIFICATION_SERVICE_HOST',
  'NOTIFICATION_SERVICE_PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'MAIL_FROM',
  'MAIL_TOKEN',
  'MAIL_TRAP_SANDBOX',
  'DB_POOL_MAX',
];

const localOnlyEnvKeys = ['MAIL_TRAP_SANDBOX_INBOX_ID'];
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

describe('Notification service environment files', () => {
  it.each(['.env', '.env.example'])(
    '%s includes every local notification env key',
    (fileName) => {
      const keys = readEnvKeys(fileName);

      expect([...keys].sort()).toEqual(
        [...requiredEnvKeys, ...localOnlyEnvKeys].sort(),
      );
    },
  );

  it('keeps NODE_ENV and certificate configuration prod-only', () => {
    const keys = readEnvKeys('.env.prod');

    expect([...keys].sort()).toEqual(
      [...requiredEnvKeys, ...prodOnlyEnvKeys].sort(),
    );
  });

  it('validates every required runtime key in NotificationModule', () => {
    const source = readFileSync(
      join(__dirname, 'notification.module.ts'),
      'utf8',
    );

    for (const key of [...requiredEnvKeys, ...localOnlyEnvKeys]) {
      expect(source).toMatch(new RegExp(`${key}: Joi\\.(string|bool)\\(\\)`));
    }

    expect(source).toContain('NODE_ENV: Joi.string().optional()');
  });
});
