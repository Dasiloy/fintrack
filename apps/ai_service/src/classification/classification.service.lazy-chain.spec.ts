import { readFileSync } from 'fs';
import { join } from 'path';

describe('ClassificationService chain loading', () => {
  it('does not build the classification LangChain pipeline at service startup', () => {
    const source = readFileSync(
      join(__dirname, 'classification.service.ts'),
      'utf8',
    );

    expect(source).not.toContain('OnModuleInit');
    expect(source).not.toContain('onModuleInit()');

    expect(source).toContain('getClassificationChain');
    expect(source).toContain('buildStructuredChain');
    expect(source).toContain('classificationSchema');
  });
});
