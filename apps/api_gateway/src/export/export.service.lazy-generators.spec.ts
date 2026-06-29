import { readFileSync } from 'fs';
import { join } from 'path';

describe('ExportService generator loading', () => {
  it('does not load heavy report generators at module import time', () => {
    const source = readFileSync(join(__dirname, 'export.service.ts'), 'utf8');

    expect(source).not.toContain("from './generators/image.generator'");
    expect(source).not.toContain("from './generators/pdf.generator'");
    expect(source).not.toContain("from './generators/xlsx.generator'");

    expect(source).toContain("import('./generators/image.generator')");
    expect(source).toContain("import('./generators/pdf.generator')");
    expect(source).toContain("import('./generators/xlsx.generator')");
  });
});
