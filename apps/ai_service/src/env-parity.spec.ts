import { readFileSync } from 'fs';
import { join } from 'path';

const requiredEnvKeys = [
  'MICROSERVICE_NAME',
  'AI_SERVICE_HOST',
  'AI_SERVICE_PORT',
  'FINANCE_SERVICE_HOST',
  'FINANCE_SERVICE_PORT',
  'DATABASE_URL',
  'REDIS_URL',
  'OPENAI_API_KEY',
  'ANTHROPIC_API_KEY',
  'GOOGLE_GEN_AI_API_KEY',
  'ALPHA_VANTAGE_API_KEY',
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

describe('AI service environment files', () => {
  it.each(['.env', '.env.example', '.env.prod'])(
    '%s includes every AI service env key',
    (fileName) => {
      const keys = readEnvKeys(fileName);

      expect([...keys].sort()).toEqual([...requiredEnvKeys].sort());
    },
  );

  it('validates every required runtime key in AiModule', () => {
    const source = readFileSync(join(__dirname, 'ai.module.ts'), 'utf8');

    for (const key of requiredEnvKeys) {
      expect(source).toContain(`${key}: Joi.string()`);
    }
  });
});
