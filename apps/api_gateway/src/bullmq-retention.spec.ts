import { readFileSync } from 'fs';
import { join } from 'path';

const moduleFiles = [
  '../../../apps/api_gateway/src/app.module.ts',
  '../../../apps/ai_service/src/ai.module.ts',
  '../../../apps/auth_service/src/auth.module.ts',
  '../../../apps/finance_service/src/finance.module.ts',
  '../../../apps/notification_service/src/notification.module.ts',
  '../../../apps/payment_service/src/payment.module.ts',
  '../../../apps/scheduler_service/src/scheduler.module.ts',
];

describe('BullMQ retention defaults', () => {
  it('defines conservative shared job retention defaults', () => {
    const source = readFileSync(
      join(
        __dirname,
        '../../../packages/types/src/constants/bullmq.constants.ts',
      ),
      'utf8',
    );

    expect(source).toContain('BULLMQ_DEFAULT_JOB_OPTIONS');
    expect(source).toContain('removeOnComplete');
    expect(source).toContain('removeOnFail');
  });

  it('applies shared retention defaults to every BullMQ root', () => {
    for (const moduleFile of moduleFiles) {
      const source = readFileSync(join(__dirname, moduleFile), 'utf8');

      expect(source).toContain('BULLMQ_DEFAULT_JOB_OPTIONS');
      expect(source).toContain('defaultJobOptions: BULLMQ_DEFAULT_JOB_OPTIONS');
    }
  });
});
