type Level = 'debug' | 'info' | 'warn' | 'error';
const order: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = order[(process.env.LOG_LEVEL as Level) ?? 'info'] ?? order.info;

function log(level: Level, scope: string, message: string, meta?: unknown) {
  if (order[level] < threshold) return;
  const worker = process.env.TEST_WORKER_INDEX ?? '-';
  const line = `${new Date().toISOString()} [${level.toUpperCase()}] [w${worker}] [${scope}] ${message}`;
  (level === 'error' ? console.error : console.log)(
    meta === undefined ? line : `${line} ${JSON.stringify(meta)}`,
  );
}

export const logger = (scope: string) => ({
  debug: (m: string, meta?: unknown) => log('debug', scope, m, meta),
  info: (m: string, meta?: unknown) => log('info', scope, m, meta),
  warn: (m: string, meta?: unknown) => log('warn', scope, m, meta),
  error: (m: string, meta?: unknown) => log('error', scope, m, meta),
});
