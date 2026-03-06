import { env } from '@/env';

/**
 * Handle Global Logs
 * We will use this to disable all console logs in production
 *
 *
 * @class Global Logger
 */
export class Logger {
  private static _instance: Logger | null = null;

  private constructor() {
    if (!Logger._instance) {
      Logger._instance = new Logger();
    }
    return Logger._instance;
  }

  public static get instance() {
    return Logger._instance;
  }

  log(...args: any[]) {
    this._catch(() => {
      console.log(args);
    });
  }

  debug() {}

  error() {}

  private _catch(func: () => void) {
    if (env.NODE_ENV === 'production') return;
    func();
  }
}
