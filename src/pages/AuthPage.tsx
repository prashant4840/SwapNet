import { useState } from 'react'
import { ArrowRight, LockKeyhole, Mail, Sparkles } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { demoCredentials } from '@/data/seed'
import { useApp } from '@/context/AppContext'

type AuthTab = 'signup' | 'login'

export function AuthPage() {
  const navigate = useNavigate()
  const { login, loginWithGoogle, signUp } = useApp()
  const [tab, setTab] = useState<AuthTab>('signup')
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    city: '',
    password: '',
  })
  const [loginForm, setLoginForm] = useState({
    email: demoCredentials.email,
    password: demoCredentials.password,
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  return (
    <PageTransition>
      <main className="page-shell grid min-h-[calc(100vh-3rem)] gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-white/30 bg-hero-gradient p-8 shadow-glow dark:bg-hero-gradient-dark sm:p-10">
          <Badge tone="brand">Auth + onboarding</Badge>
          <h1 className="mt-6 max-w-xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl">
            Build a profile that makes skill swapping feel obvious.
          </h1>
          <p className="mt-4 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
            Start with email or continue with Google. In demo mode, the app ships with a
            preloaded profile so you can test requests, chat, and reviews immediately.
          </p>

          <div className="mt-8 grid gap-4">
            {[
              'Google OAuth flow ready when Supabase environment variables are added',
              'Email signup instantly creates a personalized public profile',
              'All flows persist locally with seeded demo data for fast testing',
            ].map((point) => (
              <div
                className="flex items-center gap-3 rounded-3xl border border-white/40 bg-white/70 px-4 py-4 dark:border-slate-700 dark:bg-slate-900/70"
                key={point}
              >
                <div className="rounded-2xl bg-brand-100 p-2 text-brand-700 dark:bg-brand-500/20 dark:text-brand-200">
                  <Sparkles className="size-4" />
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-200">{point}</p>
              </div>
            ))}
          </div>

          <div className="mt-8 rounded-[2rem] bg-slate-950 px-5 py-5 text-slate-50 shadow-soft">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-400">
              Demo credentials
            </p>
            <div className="mt-4 space-y-2 text-sm">
              <p>Email: {demoCredentials.email}</p>
              <p>Password: {demoCredentials.password}</p>
            </div>
          </div>
        </section>

        <section className="glass-panel p-6 sm:p-8">
          <div className="inline-flex rounded-full border border-slate-200 bg-slate-100 p-1 dark:border-slate-700 dark:bg-slate-800/80">
            {(['signup', 'login'] as const).map((item) => (
              <button
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  tab === item
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                    : 'text-slate-500 dark:text-slate-300'
                }`}
                key={item}
                onClick={() => {
                  setError('')
                  setTab(item)
                }}
                type="button"
              >
                {item === 'signup' ? 'Sign up' : 'Log in'}
              </button>
            ))}
          </div>

          <div className="mt-8 space-y-6">
            <div>
              <h2 className="text-2xl font-bold text-slate-950 dark:text-white">
                {tab === 'signup' ? 'Create your SkillBridge account' : 'Welcome back'}
              </h2>
              <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
                {tab === 'signup'
                  ? 'Post what you can teach and what you want to learn next.'
                  : 'Jump back into your swaps, messages, and reviews.'}
              </p>
            </div>

            <Button
              fullWidth
              onClick={async () => {
                setLoading(true)
                setError('')
                const result = await loginWithGoogle()
                setLoading(false)
                if (!result.success) {
                  setError(result.message ?? 'Google sign-in failed.')
                  return
                }
                navigate('/dashboard')
              }}
              size="lg"
              variant="outline"
            >
              <Mail className="size-4" />
              Continue with Google
            </Button>

            <div className="flex items-center gap-3">
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
                Or with email
              </p>
              <div className="h-px flex-1 bg-slate-200 dark:bg-slate-700" />
            </div>

            {tab === 'signup' ? (
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault()
                  setLoading(true)
                  setError('')
                  const result = await signUp(signupForm)
                  setLoading(false)
                  if (!result.success) {
                    setError(result.message ?? 'Could not create your account.')
                    return
                  }
                  navigate('/settings')
                }}
              >
                <div className="grid gap-4 sm:grid-cols-2">
                  <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    Name
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                      onChange={(event) =>
                        setSignupForm((current) => ({ ...current, name: event.target.value }))
                      }
                      placeholder="Ava Shah"
                      required
                      value={signupForm.name}
                    />
                  </label>
                  <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                    City
                    <input
                      className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                      onChange={(event) =>
                        setSignupForm((current) => ({ ...current, city: event.target.value }))
                      }
                      placeholder="Mumbai"
                      required
                      value={signupForm.city}
                    />
                  </label>
                </div>
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                    onChange={(event) =>
                      setSignupForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={signupForm.email}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Password
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                    onChange={(event) =>
                      setSignupForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Create a password"
                    required
                    type="password"
                    value={signupForm.password}
                  />
                </label>
                {error ? (
                  <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                  </p>
                ) : null}
                <Button disabled={loading} fullWidth size="lg" type="submit">
                  Create account
                  <ArrowRight className="size-4" />
                </Button>
              </form>
            ) : (
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault()
                  setLoading(true)
                  setError('')
                  const result = await login(loginForm)
                  setLoading(false)
                  if (!result.success) {
                    setError(result.message ?? 'Could not log you in.')
                    return
                  }
                  navigate('/dashboard')
                }}
              >
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Email
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, email: event.target.value }))
                    }
                    placeholder="you@example.com"
                    required
                    type="email"
                    value={loginForm.email}
                  />
                </label>
                <label className="space-y-2 text-sm font-medium text-slate-700 dark:text-slate-200">
                  Password
                  <input
                    className="w-full rounded-2xl border border-slate-200 bg-white/80 px-4 py-3 dark:border-slate-700 dark:bg-slate-900"
                    onChange={(event) =>
                      setLoginForm((current) => ({ ...current, password: event.target.value }))
                    }
                    placeholder="Enter your password"
                    required
                    type="password"
                    value={loginForm.password}
                  />
                </label>
                {error ? (
                  <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                  </p>
                ) : null}
                <Button disabled={loading} fullWidth size="lg" type="submit">
                  <LockKeyhole className="size-4" />
                  Log in
                </Button>
              </form>
            )}

            <p className="text-sm text-slate-500 dark:text-slate-300">
              Want to browse first?{' '}
              <Link className="font-semibold text-brand-600 dark:text-brand-300" to="/explore">
                Explore live listings
              </Link>
            </p>
          </div>
        </section>
      </main>
    </PageTransition>
  )
}
