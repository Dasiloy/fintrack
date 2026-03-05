/**
 * Central logger used to disable console output in production.
 *
 * Single instance: use the exported `logger` or `new Logger()`. In production
 * (`env.NODE_ENV === 'production'`) all methods no-op; otherwise they forward
 * to `console.log`, `console.debug`, and `console.error` with a timestamp prefix.
 * Pass an optional context label as the first argument when you have 2+ args, e.g.
 * `logger.error('Login', 'error occurred')` → `[Login]: error occurred`.
 */
class ConsoleLogger {
  private static _instance: ConsoleLogger | null = null;

  /**
   * Returns the singleton instance. Use the exported `logger` or `new Logger()`.
   *
   * @returns The shared Logger instance.
   */
  constructor() {
    if (ConsoleLogger._instance != null) {
      return ConsoleLogger._instance;
    }
    ConsoleLogger._instance = this;
  }

  /**
   * Returns a timestamp prefix for log lines (ISO string).
   *
   * @internal
   */
  private _timestamp(): string {
    return new Date().toISOString();
  }

  /** @internal Pretty-format a single argument: null/undefined as strings, objects with indent 2. */
  private _formatArg(value: unknown): unknown {
    if (value === null) return 'null';
    if (value === undefined) return 'undefined';
    if (typeof value === 'object' && value !== null) {
      try {
        return JSON.stringify(value, null, 2);
      } catch {
        return String(value);
      }
    }
    return value;
  }

  /** @internal Format all args for pretty log output (null, undefined, objects with spacing 2). */
  private _formatArgs(args: unknown[]): unknown[] {
    return args.map((arg) => this._formatArg(arg));
  }

  /** @internal When 2+ args and first is string, treat as context; else no context. */
  private _contextAndArgs(
    contextOrFirst?: string,
    ...rest: unknown[]
  ): { context: string | undefined; args: unknown[] } {
    if (rest.length >= 1 && contextOrFirst !== undefined) {
      return { context: contextOrFirst, args: rest };
    }
    return {
      context: undefined,
      args: contextOrFirst !== undefined ? [contextOrFirst, ...rest] : rest,
    };
  }

  /**
   * Logs only when not in production. Forwards to `console.log` with a timestamp prefix.
   * Values are pretty-printed: null/undefined shown explicitly, objects with 2-space indent.
   *
   * @param contextOrFirst - Optional context label when passed with 2+ args (e.g. `'Login'`), else first message arg.
   * @param args - Message parts (same as `console.log`).
   */
  log(contextOrFirst?: string, ...args: unknown[]) {
    const { context, args: messageArgs } = this._contextAndArgs(contextOrFirst, ...args);
    this._catch(() => {
      const formatted = this._formatArgs(messageArgs);
      if (context) {
        console.log(`[${this._timestamp()}]`, `[${context}]:`, ...formatted);
      } else {
        console.log(`[${this._timestamp()}]`, ...formatted);
      }
    });
  }

  /**
   * Debug logs only when not in production. Forwards to `console.debug` with a timestamp prefix.
   * Values are pretty-printed: null/undefined shown explicitly, objects with 2-space indent.
   *
   * @param contextOrFirst - Optional context label when passed with 2+ args, else first message arg.
   * @param args - Message parts (same as `console.debug`).
   */
  debug(contextOrFirst?: string, ...args: unknown[]) {
    const { context, args: messageArgs } = this._contextAndArgs(contextOrFirst, ...args);
    this._catch(() => {
      const formatted = this._formatArgs(messageArgs);
      if (context) {
        console.debug(`[${this._timestamp()}]`, `[${context}]:`, ...formatted);
      } else {
        console.debug(`[${this._timestamp()}]`, ...formatted);
      }
    });
  }

  /**
   * Error logs only when not in production. Forwards to `console.error` with a timestamp prefix.
   * Values are pretty-printed: null/undefined shown explicitly, objects with 2-space indent.
   *
   * @param contextOrFirst - Optional context label when passed with 2+ args, else first message arg.
   * @param args - Message parts (same as `console.error`).
   */
  error(contextOrFirst?: string, ...args: unknown[]) {
    const { context, args: messageArgs } = this._contextAndArgs(contextOrFirst, ...args);
    this._catch(() => {
      const formatted = this._formatArgs(messageArgs);
      if (context) {
        console.error(`[${this._timestamp()}]`, `[${context}]:`, ...formatted);
      } else {
        console.error(`[${this._timestamp()}]`, ...formatted);
      }
    });
  }

  /** @internal No-op in production; otherwise runs the given function. */
  private _catch(func: () => void) {
    if (process.env.NODE_ENV === 'production') return;
    func();
  }
}

export const consoleLogger = new ConsoleLogger();
