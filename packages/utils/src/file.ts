/**
 * Convert a file to a base64 string
 *
 * @param file file to convert to base64
 * @returns base64 string
 */
export function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

/**
 * Convert a base64 string to a file
 *
 * @param base64 base64 string to convert to file
 * @returns file
 */
export function base64ToBufferingString(base64: string): string {
  return base64.replace(/^data:image\/\w+;base64,/, '');
}

/**
 * Trigger a browser file download from a raw base64 string (no data-URL prefix).
 * Safe to call in any browser context that has a DOM.
 */
export function downloadFromBase64(base64: string, filename: string, mimeType: string): void {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}
