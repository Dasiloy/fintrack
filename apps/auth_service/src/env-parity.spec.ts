import { readFileSync } from 'fs';
import { join } from 'path';

const requiredEnvKeys = [
  'MICROSERVICE_NAME',
  'AUTH_SERVICE_HOST',
  'AUTH_SERVICE_PORT',
  'PAYMENT_SERVICE_HOST',
  'PAYMENT_SERVICE_PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'JWT_SECRET',
  'JWT_REFRESH_SECRET',
  'JWT_OTP_SECRET',
  'JWT_ACCESS_TOKEN_EXPIRATION',
  'JWT_REFRESH_TOKEN_EXPIRATION',
  'JWT_OTP_TOKEN_EXPIRATION',
  'JWT_2FA_SECRET',
  'JWT_2FA_TOKEN_EXPIRATION',
  'OTP_EXPIRY_MINUTES',
  'MAX_LOGIN_ATTEMPTS',
  'AES_KEY',
  'AUTH_GOOGLE_ID',
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

describe('Auth service environment files', () => {
  it.each(['.env', '.env.example'])(
    '%s includes every local auth env key',
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

  it('validates every required runtime key in AuthModule', () => {
    const source = readFileSync(join(__dirname, 'auth.module.ts'), 'utf8');

    for (const key of requiredEnvKeys) {
      expect(source).toMatch(new RegExp(`${key}: Joi\\.(string|number)\\(\\)`));
    }

    expect(source).toContain('NODE_ENV: Joi.string().optional()');
  });
});
