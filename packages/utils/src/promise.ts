/**
 * @description Promisify a function
 * @param fn
 * @returns Promise<void>
 */
export function promisify(fn: Function, timeout = 2000): Promise<void> {
  return new Promise((resolve, reject) => {
    try {
      setTimeout(() => {
        fn();
        resolve(void 0);
      }, timeout);
    } catch (error) {
      reject(error);
    }
  });
}
