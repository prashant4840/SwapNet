import { captureException as sentryCaptureException, setUserContext as sentrySetUserContext } from './errorTracking'
import { supabase } from '@/lib/supabase'

export type Severity = 'info' | 'warning' | 'error' | 'critical'

export interface LogPayload {
  message: string
  severity?: Severity
  context?: Record<string, unknown>
  error?: unknown
}

class MonitoringService {
  private correlationId: string
  private environment: string
  private release: string = '1.1.0'
  private userId: string | null = null
  private userEmail: string | null = null

  constructor() {
    this.correlationId = this.generateUUID()
    this.environment = import.meta.env.MODE || 'production'
    console.log(`[Monitoring] Observability initialized. Environment: ${this.environment}, CorrelationID: ${this.correlationId}`)
  }

  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID()
    }
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0
      const v = c === 'x' ? r : (r & 0x3) | 0x8
      return v.toString(16)
    })
  }

  public getCorrelationId(): string {
    return this.correlationId
  }

  public getEnvironment(): string {
    return this.environment
  }

  public getRelease(): string {
    return this.release
  }

  public setUser(id: string, email: string | null = null) {
    this.userId = id
    this.userEmail = email
    sentrySetUserContext(id, email || undefined)
  }

  public clearUser() {
    this.userId = null
    this.userEmail = null
  }

  /**
   * Log structured event to console and push errors/exceptions to database + Sentry
   */
  public log({ message, severity = 'info', context = {}, error }: LogPayload) {
    const timestamp = new Date().toISOString()
    const logMetadata = {
      timestamp,
      correlationId: this.correlationId,
      environment: this.environment,
      release: this.release,
      userId: this.userId,
      userEmail: this.userEmail,
      severity,
      ...context,
    }

    // 1. Write structured log to Console
    const consoleMsg = `[${timestamp}] [${severity.toUpperCase()}] [CID:${this.correlationId}] ${message}`
    if (severity === 'info') {
      console.log(consoleMsg, context)
    } else if (severity === 'warning') {
      console.warn(consoleMsg, context, error || '')
    } else {
      console.error(consoleMsg, context, error || '')
    }

    // 2. Capture Exceptions in Sentry
    if (severity === 'error' || severity === 'critical' || error) {
      sentryCaptureException(error || new Error(message), logMetadata)
      
      // 3. Persist error/critical log directly into public.error_logs database table for Admin Diagnostics
      if (supabase) {
        void supabase.from('error_logs').insert({
          message,
          stack: error instanceof Error ? error.stack : String(error || ''),
          context: logMetadata,
          user_id: this.userId,
          severity,
        }).then(({ error: dbErr }) => {
          if (dbErr) {
            console.error('[Monitoring] Failed to persist error log in database:', dbErr)
          }
        })
      }
    }
  }

  public info(message: string, context?: Record<string, unknown>) {
    this.log({ message, severity: 'info', context })
  }

  public warn(message: string, context?: Record<string, unknown>, error?: unknown) {
    this.log({ message, severity: 'warning', context, error })
  }

  public error(message: string, context?: Record<string, unknown>, error?: unknown) {
    this.log({ message, severity: 'error', context, error })
  }

  public critical(message: string, context?: Record<string, unknown>, error?: unknown) {
    this.log({ message, severity: 'critical', context, error })
  }
}

export const monitoring = new MonitoringService()
export default monitoring
