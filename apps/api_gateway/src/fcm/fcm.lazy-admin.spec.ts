import { readFileSync } from 'fs';
import { join } from 'path';

describe('FcmService Firebase Admin loading', () => {
  it('does not load Firebase Admin at gateway startup', () => {
    const moduleSource = readFileSync(join(__dirname, 'fcm.module.ts'), 'utf8');
    const serviceSource = readFileSync(
      join(__dirname, 'fcm.service.ts'),
      'utf8',
    );

    expect(moduleSource).not.toContain("from 'firebase-admin'");
    expect(moduleSource).not.toContain('FCM_ADMIN');
    expect(serviceSource).not.toContain("from 'firebase-admin'");
    expect(serviceSource).not.toContain('FCM_ADMIN');

    expect(serviceSource).toContain("import('firebase-admin')");
  });
});
