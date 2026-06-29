import { readFileSync } from 'fs';
import { join } from 'path';

const requiredEnvKeys = [
  'MICROSERVICE_NAME',
  'API_GATEWAY_HOST',
  'API_GATEWAY_PORT',
  'NEXT_PUBLIC_APP_URL',
  'AUTH_SERVICE_HOST',
  'AUTH_SERVICE_PORT',
  'FINANCE_SERVICE_HOST',
  'FINANCE_SERVICE_PORT',
  'AI_SERVICE_HOST',
  'AI_SERVICE_PORT',
  'PAYMENT_SERVICE_HOST',
  'PAYMENT_SERVICE_PORT',
  'SCHEDULER_SERVICE_HOST',
  'SCHEDULER_SERVICE_PORT',
  'NOTIFICATION_SERVICE_HOST',
  'NOTIFICATION_SERVICE_PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'AES_KEY',
  'CLOUDINARY_URL',
  'CLOUDINARY_SIGNATURE_EXPIRATION',
  'PAYSTACK_PRO_MONTHLY_PRICE_ID',
  'PAYSTACK_SECRET_KEY',
  'MONO_SECRET_KEY',
  'MONO_WEBHOOK_SECRET',
  'SWAGGER_DOC_USER',
  'SWAGGER_DOC_PASS',
  'FIREBASE_SERVICE_ACCOUNT',
  'DB_POOL_MAX',
];

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

describe('API gateway environment files', () => {
  it.each(['.env', '.env.example', '.env.prod'])(
    '%s includes every API gateway env key',
    (fileName) => {
      const keys = readEnvKeys(fileName);

      expect([...keys].sort()).toEqual([...requiredEnvKeys].sort());
    },
  );

  it('validates every required runtime key in AppModule', () => {
    const source = readFileSync(join(__dirname, 'app.module.ts'), 'utf8');

    for (const key of requiredEnvKeys) {
      expect(source).toContain(`${key}: Joi.string()`);
    }
  });
});
