'use client';

import * as React from 'react';
import * as XLSX from 'xlsx';

export type SheetRow = (string | number | boolean | null)[];

interface SpreadsheetData {
  header: SheetRow;
  rows: SheetRow[];
  sheetNames: string[];
  activeSheet: string;
  setActiveSheet: (name: string) => void;
}

export function useSpreadsheetData(base64: string): SpreadsheetData {
  const [activeSheet, setActiveSheet] = React.useState<string>('');

  const workbook = React.useMemo(() => {
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      return XLSX.read(bytes, { type: 'array' });
    } catch {
      return null;
    }
  }, [base64]);

  const sheetNames = workbook?.SheetNames ?? [];

  React.useEffect(() => {
    if (sheetNames.length > 0 && !activeSheet) {
      setActiveSheet(sheetNames[0]!);
    }
  }, [sheetNames, activeSheet]);

  const { header, rows } = React.useMemo<{ header: SheetRow; rows: SheetRow[] }>(() => {
    if (!workbook) return { header: [], rows: [] };
    const name = activeSheet || sheetNames[0];
    if (!name) return { header: [], rows: [] };
    const sheet = workbook.Sheets[name];
    if (!sheet) return { header: [], rows: [] };

    const all: SheetRow[] = XLSX.utils.sheet_to_json(sheet, {
      header: 1,
      defval: null,
      blankrows: false,
    }) as SheetRow[];

    const [head = [], ...data] = all;
    return { header: head, rows: data.slice(0, 20) };
  }, [workbook, activeSheet, sheetNames]);

  return { header, rows, sheetNames, activeSheet, setActiveSheet };
}
