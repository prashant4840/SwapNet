import { useState, useEffect } from 'react'
import { Ban, CheckCircle, AlertTriangle } from 'lucide-react'
import { Button } from '@/components/common/Button'
import { EmptyState } from '@/components/common/EmptyState'
import { PageTransition } from '@/components/common/PageTransition'
import { SectionTitle } from '@/components/common/SectionTitle'
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

export function AdminPage() {
  const { currentUser, state } = useApp()
  const [reportedUsers, setReportedUsers] = useState<ReportedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [actionInProgress, setActionInProgress] = useState<string | null>(null)

  // Only allow admins - for now just currentUser check
  const isAdmin = currentUser?.email?.includes('@admin')

  useEffect(() => {
    if (!isAdmin || !isSupabaseConfigured || !supabase) {
      setLoading(false)
      return
    }

    loadReports()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isAdmin, state.users])

  async function loadReports() {
    try {
      const { data, error } = await supabase!
        .from('abuse_reports')
        .select('*')
        .order('created_at', { ascending: false })

      if (error || !data) {
        toast.error('Failed to load reports')
        return
      }

      // Group by reported_user_id
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
      setLoading(false)
    }
  }

  async function dismissReport(userId: string) {
    setActionInProgress(userId)
    try {
      const { error } = await supabase!
        .from('abuse_reports')
        .update({ status: 'dismissed' })
        .eq('reported_user_id', userId)

      if (error) {
        toast.error('Failed to dismiss report')
        return
      }

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
      // Mark as banned in abuse_reports
      const { error: reportError } = await supabase!
        .from('abuse_reports')
        .update({ status: 'banned' })
        .eq('reported_user_id', userId)

      if (reportError) {
        toast.error('Failed to ban user')
        return
      }

      // Optionally: update user status if there's a banned_at field
      await supabase!
        .from('profiles')
        .update({ banned_at: new Date().toISOString() })
        .eq('id', userId)

      toast.success(`User banned`)
      setReportedUsers((prev) => prev.filter((r) => r.userId !== userId))
    } catch (err) {
      console.error('Error banning user:', err)
      toast.error('Failed to ban user')
    } finally {
      setActionInProgress(null)
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

  if (loading) {
    return (
      <PageTransition>
        <div className="flex min-h-[60vh] items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
            <p className="text-sm text-slate-500 dark:text-slate-400">Loading reports...</p>
          </div>
        </div>
      </PageTransition>
    )
  }

  return (
    <PageTransition>
      <div className="space-y-6">
        <section className="glass-panel p-6">
          <SectionTitle description="Review and manage user abuse reports">
            Abuse Report Dashboard
          </SectionTitle>
        </section>

        {reportedUsers.length === 0 ? (
          <EmptyState
            title="No reports"
            description="All users are in good standing. Great job keeping the community safe!"
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
                    {reported.user?.photo ? (
                      <img
                        src={reported.user.photo}
                        alt={reported.user.name}
                        className="size-12 rounded-lg object-cover flex-shrink-0"
                      />
                    ) : (
                      <div className="size-12 rounded-lg bg-slate-200 dark:bg-slate-700 flex items-center justify-center flex-shrink-0">
                        <span className="text-sm font-semibold">
                          {reported.user?.name?.[0] || '?'}
                        </span>
                      </div>
                    )}
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
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-2">
                        Latest report: {new Date(reported.latestReport.created_at).toLocaleDateString()}
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

                {/* Detailed reports */}
                <div className="mt-4 pt-4 border-t border-slate-200 dark:border-slate-700">
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-3">
                    Report history ({reported.allReports.length})
                  </p>
                  <div className="space-y-2">
                    {reported.allReports.slice(0, 3).map((report) => (
                      <div
                        key={report.id}
                        className="text-sm p-3 rounded-lg bg-slate-50 dark:bg-slate-900/50"
                      >
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <p className="text-slate-700 dark:text-slate-200">{report.reason}</p>
                          <span className="text-xs text-slate-500 dark:text-slate-400 flex-shrink-0">
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                    ))}
                    {reported.allReports.length > 3 && (
                      <p className="text-xs text-slate-500 dark:text-slate-400 py-2">
                        +{reported.allReports.length - 3} more reports
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </PageTransition>
  )
}
