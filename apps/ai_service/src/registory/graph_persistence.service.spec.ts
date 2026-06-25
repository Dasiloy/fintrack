import * as path from 'node:path';
import * as fs from 'node:fs';
import * as os from 'node:os';

import { normalizeLangGraphPostgresConnectionString } from './graph_persistence.utils';

describe('normalizeLangGraphPostgresConnectionString', () => {
  it('leaves connection strings without SSL root cert config unchanged', () => {
    const url = 'postgresql://user:pass@railway.internal:5432/railway';

    expect(normalizeLangGraphPostgresConnectionString(url)).toBe(url);
  });

  it('resolves relative sslrootcert paths and defaults to require', () => {
    const url =
      'postgresql://user:pass@aiven.example:5432/defaultdb?sslrootcert=ca.pem&application_name=ai_service';

    const result = new URL(
      normalizeLangGraphPostgresConnectionString(url, '/repo'),
    );

    expect(result.searchParams.get('sslrootcert')).toBe(
      path.resolve('/repo', 'ca.pem'),
    );
    expect(result.searchParams.get('sslmode')).toBe('require');
    expect(result.searchParams.get('application_name')).toBe('ai_service');
  });

  it('preserves explicit sslmode from the database URL', () => {
    const url =
      'postgresql://user:pass@aiven.example:5432/defaultdb?sslrootcert=/secure/ca.pem&sslmode=require';

    const result = new URL(normalizeLangGraphPostgresConnectionString(url));

    expect(result.searchParams.get('sslrootcert')).toBe('/secure/ca.pem');
    expect(result.searchParams.get('sslmode')).toBe('require');
  });

  it('finds relative sslrootcert files in monorepo ancestor folders', () => {
    const repoRoot = fs.mkdtempSync(path.join(os.tmpdir(), 'fintrack-'));
    const serviceDir = path.join(repoRoot, 'apps', 'ai_service');
    fs.mkdirSync(serviceDir, { recursive: true });
    fs.writeFileSync(path.join(repoRoot, 'ca.pem'), 'test-ca');

    const url =
      'postgresql://user:pass@aiven.example:5432/defaultdb?sslrootcert=ca.pem';

    const result = new URL(
      normalizeLangGraphPostgresConnectionString(url, serviceDir),
    );

    expect(result.searchParams.get('sslrootcert')).toBe(
      path.join(repoRoot, 'ca.pem'),
    );
  });
});
