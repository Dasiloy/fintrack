import { readFileSync } from 'fs';
import { join } from 'path';

describe('UploadService ExcelJS loading', () => {
  it('does not load ExcelJS at gateway startup', () => {
    const source = readFileSync(join(__dirname, 'upload.service.ts'), 'utf8');

    expect(source).not.toContain("from 'exceljs'");
    expect(source).not.toContain('import * as ExcelJS');

    expect(source).toContain("import('exceljs')");
  });
});
