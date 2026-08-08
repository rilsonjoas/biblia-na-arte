import * as Sentry from '@sentry/node';

let isInitialized = false;

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) {
    return;
  }

  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV || 'development',
    tracesSampleRate: process.env.NODE_ENV === 'production' ? 0.1 : 1.0,
  });

  isInitialized = true;
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  if (!isInitialized) return;
  Sentry.captureException(error, context ? { extra: context } : undefined);
}
