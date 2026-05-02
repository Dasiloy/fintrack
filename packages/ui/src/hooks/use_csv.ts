'use client';

import { useCallback } from 'react';
import { useBoolean } from '@ui/hooks/use_boolean';

function escapeCell(value: unknown): string {
  const str = value == null ? '' : String(value);
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? `"${str.replace(/"/g, '""')}"`
    : str;
}

function triggerDownload(csv: string, filename: string) {
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function useCsv(filename: string) {
  const [isDownloading, { off, on }] = useBoolean(false);

  /** Key-value export (e.g. profile) — one row per field */
  const downloadCsv = useCallback(
    (data: { label: string; value: string }[]) => {
      return new Promise((resolve, reject) => {
        try {
          on();
          const csv = data
            .map((item) => `${escapeCell(item.label)},${escapeCell(item.value)}`)
            .join('\n');
          triggerDownload(csv, filename);
          setTimeout(() => {
            off();
            resolve(true);
          }, 1500);
        } catch (error) {
          reject(error);
        }
      });
    },
    [filename],
  );

  /** Tabular export — first row is headers derived from object keys */
  const downloadTableCsv = useCallback(
    (rows: Record<string, unknown>[], { omit = [] }: { omit?: string[] } = {}) => {
      return new Promise((resolve, reject) => {
        try {
          if (rows.length === 0) {
            resolve(true);
            return;
          }
          on();
          const omitSet = new Set(omit);
          const headers = Object.keys(rows[0]!).filter((h) => !omitSet.has(h));
          const rowMaps = rows.map((row) => new Map(Object.entries(row)));
          const lines = [
            headers.map(escapeCell).join(','),
            ...rowMaps.map((map) => headers.map((h) => escapeCell(map.get(h))).join(',')),
          ];
          triggerDownload(lines.join('\n'), filename);
          setTimeout(() => {
            off();
            resolve(true);
          }, 1500);
        } catch (error) {
          reject(error);
        }
      });
    },
    [filename],
  );

  return { downloadCsv, downloadTableCsv, isDownloading };
}
