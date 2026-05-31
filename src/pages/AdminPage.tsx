import { useState, useEffect } from 'react'
import { Ban, CheckCircle, AlertTriangle, Mail, RefreshCw, Terminal, Eye } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { SectionTitle } from '@/components/common/SectionTitle'
import { Avatar } from '@/components/common/Avatar'
import { useApp } from '@/context/AppContext'
import { supabase, isSupabaseConfigured } from '@/lib/supabase'
import toast from 'react-hot-toast'
import type { UserProfile } from '@/types'

interface AbuseReport {
  id: string
  reported_user_id: string
  reporter_id: string
  reason: string
  created_at: string
  status: 'pending' | 'dismissed' | 'banned'
}

interface ReportedUser {
  userId: string
  user: UserProfile | null
  reportCount: number
  latestReport: AbuseReport
  allReports: AbuseReport[]
}

interface QueuedEmail {
  id: string
  to_email: string
  to_name: string
  type: string
  status: 'pending' | 'sent' | 'retrying' | 'failed'
  retry_count: number
  last_error: string | null
  created_at: string
  scheduled_at: string
}

interface DbErrorLog {
  id: string
  message: string
  stack: string | null
  context: Record<string, unknown>
  severity: 'info' | 'warning' | 'error' | 'critical'
  created_at: string
}

export function AdminPage() {
  const { currentUser, state } = useApp()
  const [activeTab, setActiveTab] = useState<'reports' | 'emails' | 'errors'>('reports')
  
  // Reports State
  const [reportedUsers, setReportedUsers] = useState<ReportedUser[]>([])
  const [reportsLoading, setReportsLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // Email Queue State
  const [queuedEmails, setQueuedEmails] = useState<QueuedEmail[]>([])
  const [emailsLoading, setEmailsLoading] = useState(false)

  // Error Logs State
  const [errorLogs, setErrorLogs] = useState<DbErrorLog[]>([])
  const [errorsLoading, setErrorsLoading] = useState(false)
  const [selectedLog, setSelectedLog] = useState<DbErrorLog | null>(null)

  const isAdmin = currentUser?.email?.includes('@admin')

  useEffect(() => {
    if (!isAdmin || !isSupabaseConfigured || !supabase) return

    if (activeTab === 'reports') {
      loadReports()
    } else if (activeTab === 'emails') {
      loadEmails()
    } else if (activeTab === 'errors') {
      loadErrorLogs()
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, activeTab, state.users])

  async function loadReports() {
    setReportsLoading(true)
    try {
      const { data, error } = await supabase!
        .from('abuse_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !data) {
        toast.error('Failed to load reports')
        return
      }

      const grouped = new Map<string, AbuseReport[]>()
      data.forEach((report: AbuseReport) => {
        if (!grouped.has(report.reported_user_id)) {
          grouped.set(report.reported_user_id, [])
        }
        grouped.get(report.reported_user_id)!.push(report)
      })

      const reported: ReportedUser[] = Array.from(grouped.entries()).map(([userId, reports]) => {
        const user = state.users.find((u) => u.id === userId) || null
        return {
          userId,
          user,
          reportCount: reports.length,
          latestReport: reports[0],
          allReports: reports,
        }
      })

      setReportedUsers(reported)
    } catch (err) {
      console.error('Failed to load reports:', err)
      toast.error('Failed to load reports')
    } finally {
      setReportsLoading(false)
    }
  }

  async function loadEmails() {
    setEmailsLoading(true)
    try {
      const { data, error } = await supabase!
        .from('email_queue')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setQueuedEmails(data || [])
    } catch (err) {
      console.error('Failed to load emails:', err)
      toast.error('Failed to load email queue')
    } finally {
      setEmailsLoading(false)
    }
  }

  async function loadErrorLogs() {
    setErrorsLoading(true)
    try {
      const { data, error } = await supabase!
        .from('error_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error
      setErrorLogs(data || [])
    } catch (err) {
      console.error('Failed to load error logs:', err)
      toast.error('Failed to load error logs')
    } finally {
      setErrorsLoading(false)
    }
  }

  async function dismissReport(userId: string) {
    setActionInProgress(userId)
    try {
      const { error } = await supabase!
        .from('abuse_reports')
        .update({ status: 'dismissed' })
        .eq('reported_user_id', userId)

      if (error) throw error
      toast.success('Report dismissed')
      setReportedUsers((prev) => prev.filter((r) => r.userId !== userId))
    } catch {
      toast.error('Failed to dismiss report')
    } finally {
      setActionInProgress(null)
    }
  }

  async function banUser(userId: string) {
    setActionInProgress(userId)
    try {
      const { error: reportError } = await supabase!
        .from('abuse_reports')
        .update({ status: 'banned' })
        .eq('reported_user_id', userId)

      if (reportError) throw reportError

      toast.success('User banned')
      setReportedUsers((prev) => prev.filter((r) => r.userId !== userId))
    } catch (err) {
      console.error('Error banning user:', err)
      toast.error('Failed to ban user')
    } finally {
      setActionInProgress(null)
    }
  }

  async function handleRetryEmail(queueId: string) {
    toast.loading('Invoking edge function retry...', { id: `retry-${queueId}` })
    try {
      const { error } = await supabase!.functions.invoke('send-email', {
        body: { queueId },
      })
      if (error) throw error
      toast.success('Email delivery successful!', { id: `retry-${queueId}` })
      loadEmails()
    } catch (err) {
      console.error(err)
      const errMsg = err instanceof Error ? err.message : 'Network error'
      toast.error(`Retry failed: ${errMsg}`, { id: `retry-${queueId}` })
    }
  }

  async function handleProcessAllPending() {
    toast.loading('Processing all pending queued emails...', { id: 'process-all' })
    try {
      const { error } = await supabase!.functions.invoke('send-email', {
        body: { action: 'process_queue' },
      })
      if (error) throw error
      toast.success('Batch processing triggered!', { id: 'process-all' })
      loadEmails()
    } catch (err) {
      console.error(err)
      const errMsg = err instanceof Error ? err.message : 'Network error'
      toast.error(`Batch processing failed: ${errMsg}`, { id: 'process-all' })
    }
  }

  if (!isAdmin) {
    return (
      <PageTransition>
        <EmptyState
          title="Access denied"
          description="You don't have permission to access this page."
        />
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* Banner */}
        <section className="glass-panel p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <SectionTitle description="Enterprise administration and diagnostics control center" eyebrow="Admin Portal">
            Console Center
          </SectionTitle>
          
          {/* Tab Selection */}
          <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl self-start sm:self-auto">
            <button
              onClick={() => setActiveTab('reports')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'reports'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Abuse Reports
            </button>
            <button
              onClick={() => setActiveTab('emails')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'emails'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              Email Queue
            </button>
            <button
              onClick={() => setActiveTab('errors')}
              className={`px-4 py-2 text-xs font-semibold rounded-lg transition-all ${
                activeTab === 'errors'
                  ? 'bg-white text-slate-900 shadow dark:bg-slate-700 dark:text-white'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-950 dark:hover:text-white'
              }`}
            >
              System Error Logs
            </button>
          </div>
        </section>

        {/* ── Tab: Abuse Reports ── */}
        {activeTab === 'reports' && (
          reportsLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                <p className="text-sm text-slate-500">Loading abuse reports...</p>
              </div>
            </div>
          ) : reportedUsers.length === 0 ? (
            <EmptyState
              title="Clean standing"
              description="No user abuse reports have been filed. The community is clean!"
              icon={CheckCircle}
            />
          ) : (
            <div className="space-y-4">
              {reportedUsers.map((reported) => (
                <div
                  key={reported.userId}
                  className="glass-panel rounded-2xl p-6 border border-rose-200/50 dark:border-rose-900/50"
                >
                  <div className="flex items-start justify-between gap-6 mb-4">
                    <div className="flex items-start gap-4 flex-1 min-w-0">
                      <Avatar
                        avatarUrl={reported.user?.photo}
                        fullName={reported.user?.name || 'Unknown User'}
                        size="md"
                        className="flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-slate-950 dark:text-white truncate">
                            {reported.user?.name || 'Unknown User'}
                          </h3>
                          <div className="inline-flex items-center gap-1 rounded-full bg-rose-100 dark:bg-rose-900/30 px-3 py-1 flex-shrink-0">
                            <AlertTriangle className="size-4 text-rose-600 dark:text-rose-400" />
                            <span className="text-sm font-semibold text-rose-700 dark:text-rose-200">
                              {reported.reportCount} reports
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-slate-600 dark:text-slate-300 truncate">
                          @{reported.user?.username}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => dismissReport(reported.userId)}
                        disabled={actionInProgress === reported.userId}
                        className="inline-flex items-center gap-2"
                      >
                        <CheckCircle className="size-4" />
                        Dismiss
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => banUser(reported.userId)}
                        disabled={actionInProgress === reported.userId}
                        className="inline-flex items-center gap-2 border-rose-300 text-rose-700 hover:bg-rose-50 dark:border-rose-900 dark:text-rose-400 dark:hover:bg-rose-950"
                      >
                        <Ban className="size-4" />
                        Ban
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                      Report history ({reported.allReports.length})
                    </p>
                    <div className="space-y-2">
                      {reported.allReports.map((report) => (
                        <div key={report.id} className="text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <p className="text-slate-700 dark:text-slate-200">{report.reason}</p>
                            <span className="text-xs text-slate-500 flex-shrink-0">
                              {new Date(report.created_at).toLocaleDateString()}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {/* ── Tab: Email Queue ── */}
        {activeTab === 'emails' && (
          emailsLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                <p className="text-sm text-slate-500">Loading email queue...</p>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {/* Header Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="glass-panel p-4 text-center">
                  <div className="text-2xl font-bold text-slate-900 dark:text-white">{queuedEmails.length}</div>
                  <div className="text-xs text-slate-500">Tracked Emails</div>
                </div>
                <div className="glass-panel p-4 text-center">
                  <div className="text-2xl font-bold text-tealish-600 dark:text-tealish-400">
                    {queuedEmails.filter((e) => e.status === 'sent').length}
                  </div>
                  <div className="text-xs text-slate-500">Sent</div>
                </div>
                <div className="glass-panel p-4 text-center">
                  <div className="text-2xl font-bold text-amber-500">
                    {queuedEmails.filter((e) => e.status === 'pending' || e.status === 'retrying').length}
                  </div>
                  <div className="text-xs text-slate-500">Pending / Retrying</div>
                </div>
                <div className="glass-panel p-4 text-center">
                  <div className="text-2xl font-bold text-rose-500">
                    {queuedEmails.filter((e) => e.status === 'failed').length}
                  </div>
                  <div className="text-xs text-slate-500">Failed</div>
                </div>
              </div>

              {/* Controls */}
              <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                <h3 className="font-semibold text-sm">Transactional Logs</h3>
                <Button onClick={handleProcessAllPending} size="sm" className="inline-flex items-center gap-2">
                  <RefreshCw className="size-4 animate-spin-hover" />
                  Process Pending Queue
                </Button>
              </div>

              {/* Queue List */}
              {queuedEmails.length === 0 ? (
                <EmptyState
                  title="Queue empty"
                  description="No emails have been enqueued yet."
                  icon={Mail}
                />
              ) : (
                <div className="glass-panel rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-slate-50 dark:bg-slate-800 border-b border-slate-200 dark:border-slate-700 text-xs font-semibold uppercase text-slate-500">
                          <th className="p-4">Recipient</th>
                          <th className="p-4">Type</th>
                          <th className="p-4">Status</th>
                          <th className="p-4">Retries</th>
                          <th className="p-4">Created At</th>
                          <th className="p-4 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-sm">
                        {queuedEmails.map((email) => (
                          <tr key={email.id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                            <td className="p-4 font-medium">
                              <div>{email.to_name}</div>
                              <div className="text-xs text-slate-400 font-normal">{email.to_email}</div>
                            </td>
                            <td className="p-4 font-mono text-xs">{email.type}</td>
                            <td className="p-4">
                              <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold ${
                                email.status === 'sent'
                                  ? 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400'
                                  : email.status === 'failed'
                                  ? 'bg-rose-100 text-rose-800 dark:bg-rose-900/30 dark:text-rose-400'
                                  : 'bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400'
                              }`}>
                                {email.status}
                              </span>
                              {email.last_error && (
                                <div className="text-[11px] text-rose-500 font-mono mt-1 max-w-[200px] truncate" title={email.last_error}>
                                  {email.last_error}
                                </div>
                              )}
                            </td>
                            <td className="p-4 font-mono">{email.retry_count} / 5</td>
                            <td className="p-4 text-xs text-slate-400">
                              {new Date(email.created_at).toLocaleString()}
                            </td>
                            <td className="p-4 text-right">
                              {email.status !== 'sent' && (
                                <Button
                                  onClick={() => handleRetryEmail(email.id)}
                                  size="sm"
                                  variant="outline"
                                  className="inline-flex items-center gap-1.5"
                                >
                                  <RefreshCw className="size-3" />
                                  Retry Send
                                </Button>
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          )
        )}

        {/* ── Tab: System Error Logs ── */}
        {activeTab === 'errors' && (
          errorsLoading ? (
            <div className="flex min-h-[40vh] items-center justify-center">
              <div className="flex flex-col items-center gap-3">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-500 border-t-transparent" />
                <p className="text-sm text-slate-500">Loading error logs...</p>
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
              {/* Logs List */}
              <div className="space-y-4">
                <div className="flex justify-between items-center bg-white dark:bg-slate-900 p-4 rounded-2xl border border-slate-200 dark:border-slate-800">
                  <h3 className="font-semibold text-sm">Active Traces</h3>
                  <Button onClick={loadErrorLogs} size="sm" variant="outline" className="inline-flex items-center gap-2">
                    <RefreshCw className="size-4" />
                    Refresh Logs
                  </Button>
                </div>

                {errorLogs.length === 0 ? (
                  <EmptyState
                    title="No errors logged"
                    description="Everything is running smoothly. Nice job!"
                    icon={CheckCircle}
                  />
                ) : (
                  <div className="space-y-3">
                    {errorLogs.map((log) => (
                      <div
                        key={log.id}
                        onClick={() => setSelectedLog(log)}
                        className={`glass-panel p-4 border rounded-2xl cursor-pointer transition text-left ${
                          selectedLog?.id === log.id
                            ? 'border-brand-500 ring-1 ring-brand-500 bg-brand-50/10'
                            : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-4 mb-2">
                          <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                            log.severity === 'critical'
                              ? 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-400'
                              : log.severity === 'error'
                              ? 'bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-400'
                              : 'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-400'
                          }`}>
                            {log.severity}
                          </span>
                          <span className="text-xs text-slate-400">{new Date(log.created_at).toLocaleString()}</span>
                        </div>
                        <h4 className="font-semibold text-sm text-slate-900 dark:text-white line-clamp-1">
                          {log.message}
                        </h4>
                        {typeof log.context?.correlationId === 'string' && (
                          <div className="text-[11px] text-slate-400 font-mono mt-1">
                            Correlation ID: {log.context.correlationId as string}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Log Detail Inspector */}
              <div className="space-y-4">
                <div className="glass-panel p-6 border border-slate-200 dark:border-slate-800 rounded-2xl h-full sticky top-4">
                  <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-4 mb-4">
                    <Terminal className="size-5 text-brand-500" />
                    <h3 className="font-semibold text-base">Trace Inspector</h3>
                  </div>

                  {selectedLog ? (
                    <div className="space-y-4 text-left">
                      <div>
                        <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Message</span>
                        <div className="text-sm font-semibold text-slate-900 dark:text-white bg-slate-50 dark:bg-slate-800/30 p-3 rounded-xl border border-slate-100 dark:border-slate-800/50">
                          {selectedLog.message}
                        </div>
                      </div>

                      {selectedLog.context && (
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Scope Details</span>
                          <pre className="text-[11px] font-mono p-4 rounded-xl bg-slate-900 text-slate-100 overflow-x-auto max-h-[220px]">
                            {JSON.stringify(selectedLog.context, null, 2)}
                          </pre>
                        </div>
                      )}

                      {selectedLog.stack && (
                        <div>
                          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">Stack Trace</span>
                          <pre className="text-[11px] font-mono p-4 rounded-xl bg-slate-900 text-rose-400 overflow-x-auto max-h-[300px]">
                            {selectedLog.stack}
                          </pre>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center py-20 text-center text-slate-400">
                      <Eye className="size-8 stroke-1 mb-2" />
                      <p className="text-sm font-medium">Select a trace to inspect detailed metadata and stack frames.</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )
        )}
      </div>
    </PageTransition>
  )
}
