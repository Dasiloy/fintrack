'use client';

import * as React from 'react';
import { Download, RefreshCw, X } from 'lucide-react';
import { Sheet, SheetContent } from '@ui/components';
import { cn } from '@ui/lib/utils/cn';
import { downloadFromBase64 } from '@fintrack/utils/file';
import { useSpreadsheetData } from '@/hooks/use_spreadsheet_data';
import { type ExportPreviewData } from './export_preview.types';
import { PdfPreviewCard } from './pdf_preview_card';

interface ExportPreviewSheetProps {
  open: boolean;
  onClose: () => void;
  base64: string;
  mimeType: string;
  filename: string;
  generatedAt?: string;
  previewData?: ExportPreviewData | null;
  onRegenerate: () => void;
  isRegenerating: boolean;
}

export function ExportPreviewSheet({
  open,
  onClose,
  base64,
  mimeType,
  filename,
  generatedAt,
  previewData,
  onRegenerate,
  isRegenerating,
}: ExportPreviewSheetProps) {
  const handleDownload = () => downloadFromBase64(base64, filename, mimeType);

  return (
    <Sheet open={open} onOpenChange={(v) => !v && onClose()}>
      <SheetContent
        side="bottom"
        title={filename}
        showCloseButton={false}
        className="flex h-[80vh] flex-col rounded-t-2xl px-0 pt-0 pb-0"
      >
        {/* Header */}
        <div className="border-border-subtle flex shrink-0 items-center justify-between border-b px-5 py-3">
          <div className="min-w-0">
            <p className="text-text-primary truncate text-[13px] font-semibold">{filename}</p>
            <p className="text-text-tertiary text-[11px]">Preview before downloading</p>
          </div>
          <div className="flex shrink-0 items-center gap-2">
            <button
              type="button"
              title="Regenerate"
              disabled={isRegenerating}
              onClick={onRegenerate}
              className={cn(
                'border-border-subtle text-text-tertiary hover:text-text-primary flex size-7 items-center justify-center rounded-lg border transition-colors',
                isRegenerating && 'cursor-not-allowed opacity-50',
              )}
            >
              <RefreshCw className={cn('size-3.5', isRegenerating && 'animate-spin')} />
            </button>
            <button
              type="button"
              onClick={handleDownload}
              className="bg-primary flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[11px] font-semibold text-white transition-opacity hover:opacity-90"
            >
              <Download className="size-3.5" />
              Download
            </button>
            <button
              type="button"
              onClick={onClose}
              className="border-border-subtle text-text-tertiary hover:text-text-primary flex size-7 items-center justify-center rounded-lg border transition-colors"
            >
              <X className="size-3.5" />
            </button>
          </div>
        </div>

        {/* Preview body */}
        <div className="min-h-0 flex-1 overflow-hidden">
          <PreviewBody
            mimeType={mimeType}
            base64={base64}
            filename={filename}
            generatedAt={generatedAt}
            previewData={previewData}
          />
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ────────────────────────── renderer router ──────────────────────────────────

function PreviewBody({
  mimeType,
  base64,
  filename,
  generatedAt,
  previewData,
}: {
  mimeType: string;
  base64: string;
  filename: string;
  generatedAt?: string;
  previewData?: ExportPreviewData | null;
}) {
  if (mimeType === 'application/pdf') {
    return (
      <PdfPreviewCard filename={filename} generatedAt={generatedAt} previewData={previewData} />
    );
  }

  if (mimeType === 'image/png') {
    const dataUrl = `data:image/png;base64,${base64}`;
    return (
      <div className="bg-bg-deep flex h-full w-full items-center justify-center overflow-auto p-4">
        <img
          src={dataUrl}
          alt="Export preview"
          className="max-h-full max-w-full rounded-lg object-contain shadow-lg"
        />
      </div>
    );
  }

  return <SpreadsheetPreview base64={base64} />;
}

// ────────────────────────── spreadsheet table ────────────────────────────────

function SpreadsheetPreview({ base64 }: { base64: string }) {
  const { header, rows, sheetNames, activeSheet, setActiveSheet } = useSpreadsheetData(base64);

  if (rows.length === 0) {
    return (
      <div className="flex h-full items-center justify-center">
        <p className="text-text-tertiary text-[12px]">No data to preview.</p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {sheetNames.length > 1 && (
        <div className="border-border-subtle bg-bg-elevated flex shrink-0 gap-1 border-b px-3 py-1.5">
          {sheetNames.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => setActiveSheet(name)}
              className={cn(
                'rounded px-2.5 py-0.5 text-[10px] font-medium transition-colors',
                activeSheet === name
                  ? 'bg-primary/15 text-primary'
                  : 'text-text-tertiary hover:text-text-primary',
              )}
            >
              {name}
            </button>
          ))}
        </div>
      )}

      <div className="min-h-0 flex-1 overflow-auto">
        <table className="w-full border-collapse text-[11px]">
          <thead className="bg-bg-elevated sticky top-0">
            <tr>
              {header.map((col, i) => (
                <th
                  key={i}
                  className="border-border-subtle text-text-tertiary border-b px-3 py-2 text-left font-semibold whitespace-nowrap"
                >
                  {String(col ?? '')}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri} className="border-border-subtle/50 hover:bg-bg-elevated/50 border-b">
                {row.map((cell, ci) => (
                  <td key={ci} className="text-text-primary px-3 py-1.5 whitespace-nowrap">
                    {String(cell ?? '')}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
