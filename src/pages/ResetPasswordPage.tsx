import { useEffect, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  useEffect(() => {
    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase auth is not configured.')
      return
    }

    const supabaseClient = supabase
    let isMounted = true

    async function initializeRecoverySession() {
      const { data, error: sessionError } = await supabaseClient.auth.getSession()

      if (!isMounted) return

      if (sessionError) {
        setError(sessionError.message)
        return
      }

      setReady(Boolean(data.session))
    }

    void initializeRecoverySession()

    const {
      data: { subscription },
    } = supabaseClient.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return

      if (event === 'PASSWORD_RECOVERY' || session) {
        setReady(Boolean(session))
        setError('')
      }
    })

    return () => {
      isMounted = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setLoading(true)
    setError('')
    setSuccess('')

    if (!isSupabaseConfigured || !supabase) {
      setError('Supabase auth is not configured.')
      setLoading(false)
      return
    }

    if (!ready) {
      setError('Open the recovery link from your email before setting a new password.')
      setLoading(false)
      return
    }

    try {
      const { error: updateError } = await supabase.auth.updateUser({ password })

      if (updateError) {
        setError(updateError.message)
        return
      }

      setSuccess('Password updated. Redirecting to login...')
      window.setTimeout(() => {
        navigate('/auth', { replace: true })
      }, 1200)
    } catch (submitError) {
      console.error('Failed to reset password:', submitError)
      setError('Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <main className="page-shell flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <section className="glass-panel w-full max-w-xl p-6 sm:p-8">
          <Badge tone="brand">New password</Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Choose a new password
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Open the recovery link from your email, then enter a new password to finish the reset.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              New password
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                minLength={8}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a new password"
                required
                type="password"
                value={password}
              />
            </label>

            {!ready && !error ? (
              <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
                Waiting for a valid recovery session from your email link.
              </p>
            ) : null}

            {error ? (
              <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                {error}
              </p>
            ) : null}

            {success ? (
              <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100">
                {success}
              </p>
            ) : null}

            <Button disabled={loading || !ready} fullWidth size="lg" type="submit">
              {loading ? 'Updating password...' : 'Update password'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-300">
            Need a new link?{' '}
            <Link className="font-semibold text-brand-600 dark:text-brand-300" to="/forgot-password">
              Request another reset email
            </Link>
          </p>
        </section>
      </main>
    </PageTransition>
  )
}
