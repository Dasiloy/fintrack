'use client';

import { useCallback } from 'react';
import { useBoolean } from '@ui/hooks/use_boolean';

export function useCsv(filename: string) {
  const [isDownloading, { off, on }] = useBoolean(false);
  const createCsv = useCallback((data: { label: string; value: string }[]) => {
    const csv = data.map((item) => `${item.label},${item.value}`).join('\n');
    return csv;
  }, []);

  const downloadCsv = useCallback(
    (data: { label: string; value: string }[]) => {
      return new Promise((resolve, reject) => {
        try {
          on();
          const csv = createCsv(data);
          const blob = new Blob([csv], { type: 'text/csv' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          a.click();
          a.remove();
          URL.revokeObjectURL(url);
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

  return {
    createCsv,
    downloadCsv,
    isDownloading,
  };
}
