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
export function base64ToBufferingString(base64: string): String {
  return base64.replace(/^data:image\/\w+;base64,/, '');
}
