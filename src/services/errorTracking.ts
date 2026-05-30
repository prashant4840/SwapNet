import * as Sentry from '@sentry/react'

const SENTRY_DSN = import.meta.env.VITE_SENTRY_DSN as string | undefined
const ENV = import.meta.env.MODE || 'development'

export function initErrorTracking() {
  if (SENTRY_DSN) {
    try {
      Sentry.init({
        dsn: SENTRY_DSN,
        environment: ENV,
        integrations: [],
        tracesSampleRate: 0.1,
        replaysSessionSampleRate: 0.1,
        replaysOnErrorSampleRate: 1.0,
      })
      console.log('[Sentry] Error tracking initialized in environment:', ENV)
    } catch (err) {
      console.error('[Sentry] Failed to initialize Sentry:', err)
    }
  } else {
    console.log('[Sentry] DSN not configured. Running with fallback console logger.')
  }
}

export function captureException(error: unknown, context?: Record<string, unknown>) {
  console.error('[Capture Exception]:', error, context)
  if (SENTRY_DSN) {
    Sentry.withScope((scope) => {
      if (context) {
        scope.setExtras(context)
      }
      Sentry.captureException(error)
    })
  }
}

export function captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info') {
  console.log(`[Capture Message - ${level.toUpperCase()}]:`, message)
  if (SENTRY_DSN) {
    Sentry.captureMessage(message, level as Sentry.SeverityLevel)
  }
}

export function setUserContext(id: string, email?: string, username?: string) {
  if (SENTRY_DSN) {
    Sentry.setUser({
      id,
      email,
      username,
    })
  }
}

export function clearUserContext() {
  if (SENTRY_DSN) {
    Sentry.setUser(null)
  }
}
