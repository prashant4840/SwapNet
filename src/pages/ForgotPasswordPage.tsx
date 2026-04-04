import { useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { isSupabaseConfigured, supabase } from '@/lib/supabase'

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(
        email.trim().toLowerCase(),
        { redirectTo: `${window.location.origin}/reset-password` },
      )

      if (resetError) {
        setError(resetError.message)
        return
      }

      setSuccess('Password reset email sent. Check your inbox for the recovery link.')
    } catch (submitError) {
      console.error('Failed to send password reset email:', submitError)
      setError('Failed to send password reset email.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageTransition>
      <main className="page-shell flex min-h-[calc(100vh-3rem)] items-center justify-center">
        <section className="glass-panel w-full max-w-xl p-6 sm:p-8">
          <Badge tone="brand">Password recovery</Badge>
          <h1 className="mt-4 text-3xl font-black tracking-tight text-slate-950 dark:text-white">
            Reset your password
          </h1>
          <p className="mt-3 text-sm leading-7 text-slate-600 dark:text-slate-300">
            Enter the email address tied to your SkillBridge account and we will send a secure
            recovery link.
          </p>

          <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
            <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
              Email
              <input
                className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                required
                type="email"
                value={email}
              />
            </label>

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

            <Button disabled={loading} fullWidth size="lg" type="submit">
              {loading ? 'Sending reset link...' : 'Send reset link'}
            </Button>
          </form>

          <p className="mt-6 text-sm text-slate-500 dark:text-slate-300">
            Remembered it?{' '}
            <Link className="font-semibold text-brand-600 dark:text-brand-300" to="/auth">
              Back to login
            </Link>
          </p>
        </section>
      </main>
    </PageTransition>
  )
}
