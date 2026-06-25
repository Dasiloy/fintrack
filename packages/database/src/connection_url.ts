import * as fs from 'node:fs';
import * as path from 'node:path';

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

export function normalizePostgresConnectionString<T extends string | undefined>(
  connectionString: T,
  cwd = process.cwd(),
): T {
  if (!connectionString) return connectionString;

  const url = new URL(connectionString);
  const sslRootCert = url.searchParams.get('sslrootcert');

  if (!sslRootCert) return connectionString;

  if (!path.isAbsolute(sslRootCert)) {
    url.searchParams.set('sslrootcert', resolveRelativeSslRootCert(sslRootCert, cwd));
  }

  if (!url.searchParams.has('sslmode')) {
    url.searchParams.set('sslmode', 'require');
  }

  return url.toString() as T;
}
