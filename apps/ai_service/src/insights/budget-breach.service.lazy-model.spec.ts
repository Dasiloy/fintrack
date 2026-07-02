import { readFileSync } from 'fs';
import { join } from 'path';

describe('BudgetBreachService model loading', () => {
  it('does not build the summary model at service startup', () => {
    const source = readFileSync(
      join(__dirname, 'budget_breach.service.ts'),
      'utf8',
    );

    expect(source).not.toContain('OnModuleInit');
    expect(source).not.toContain('onModuleInit()');

    expect(source).toContain('getSummaryModel');
    expect(source).toContain('getRunnable(SUMMARY_MODEL)');
  });
});
