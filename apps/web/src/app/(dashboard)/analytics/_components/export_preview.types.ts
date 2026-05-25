export interface PreviewSummaryItem {
  label: string;
  value: string;
  color?: 'green' | 'red' | 'primary';
}

export interface ExportPreviewData {
  summary: PreviewSummaryItem[];
  headers: string[];
  rows: (string | null)[][];
}
