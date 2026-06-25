import * as path from 'node:path';
import * as fs from 'node:fs';

/**
 * LangGraph's Postgres helpers own their `pg.Pool` creation when using
 * `fromConnString`, so SSL config must travel inside DATABASE_URL. Aiven-style
 * dev URLs can include `sslrootcert=ca.pem`; we resolve that relative path so
 * the driver can read the CA file no matter where the service process starts.
 *
 * Railway staging/prod URLs do not include `sslrootcert`, so they pass through
 * byte-for-byte unchanged.
 */
function resolveRelativeSslRootCert(sslRootCert: string, cwd: string): string {
  let currentDir = cwd;

  while (true) {
    const candidate = path.resolve(currentDir, sslRootCert);
    if (fs.existsSync(candidate)) return candidate;

    const parentDir = path.dirname(currentDir);
    if (parentDir === currentDir) return path.resolve(cwd, sslRootCert);
    currentDir = parentDir;
  }
}

export function normalizeLangGraphPostgresConnectionString(
  connectionString: string,
  cwd = process.cwd(),
): string {
  const url = new URL(connectionString);
  const sslRootCert = url.searchParams.get('sslrootcert');

  if (!sslRootCert) return connectionString;

  if (!path.isAbsolute(sslRootCert)) {
    url.searchParams.set(
      'sslrootcert',
      resolveRelativeSslRootCert(sslRootCert, cwd),
    );
  }

  if (!url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'verify-full');
  }

  return url.toString();
}
