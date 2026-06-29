import { readFileSync } from 'fs';
import { join } from 'path';

describe('OcrService chain loading', () => {
  it('does not build the OCR LangChain pipeline at service startup', () => {
    const source = readFileSync(join(__dirname, 'ocr.service.ts'), 'utf8');

    expect(source).not.toContain('OnModuleInit');
    expect(source).not.toContain('onModuleInit()');

    expect(source).toContain('getExtractionPipeline');
    expect(source).toContain('buildStructuredChain');
    expect(source).toContain('ChatPromptTemplate.fromMessages');
  });
});
