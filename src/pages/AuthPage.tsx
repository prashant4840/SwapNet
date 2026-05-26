import { useEffect, useState } from 'react'
import {
  ArrowRight,
  CheckCircle2,
  Loader2,
  LockKeyhole,
  Mail,
  Users,
  Zap,
} from 'lucide-react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Badge } from '@/components/common/Badge'
import { Button } from '@/components/common/Button'
import { PageTransition } from '@/components/common/PageTransition'
import { useApp } from '@/context/AppContext'
import { isSupabaseConfigured } from '@/lib/supabase'

type AuthTab = 'signup' | 'login'

export function AuthPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isAuthenticated, loading: authLoading, login, loginWithGoogle, signUp } = useApp()
  const [tab, setTab] = useState<AuthTab>('signup')
  const [signupForm, setSignupForm] = useState({
    name: '',
    email: '',
    city: '',
    password: '',
  })
  const [loginForm, setLoginForm] = useState({
    email: '',
    password: '',
  })
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [loading, setLoading] = useState(false)
  const redirectPath =
    typeof location.state === 'object' &&
    location.state !== null &&
    'from' in location.state &&
    typeof location.state.from === 'string'
      ? location.state.from
      : '/dashboard'

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      navigate(redirectPath, { replace: true })
    }
  }, [authLoading, isAuthenticated, navigate, redirectPath])

  return (
    <PageTransition>
      <main className="page-shell grid min-h-[calc(100vh-3rem)] gap-8 lg:grid-cols-[1.05fr_0.95fr]">
        <section className="relative overflow-hidden rounded-[2rem] border border-slate-200/60 bg-white/70 p-8 shadow-soft backdrop-blur-xl dark:border-slate-800 dark:bg-slate-950/60 sm:p-10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(99,102,241,0.12),transparent_34%),radial-gradient(circle_at_bottom_right,rgba(14,165,233,0.08),transparent_36%)]" />

          <div className="relative z-10 flex h-full flex-col justify-between">
            <div>
              <Badge tone="brand">Skill Exchange Platform</Badge>

              <h1 className="mt-6 max-w-2xl text-4xl font-black tracking-tight text-slate-950 dark:text-white sm:text-5xl sm:leading-[1.05]">
                Learn faster by trading skills with ambitious people.
              </h1>

              <p className="mt-5 max-w-xl text-base leading-8 text-slate-600 dark:text-slate-300">
                Teach what you know. Learn what you don’t. Connect with developers,
                designers, creators, and students building real-world skills together.
              </p>

              <div className="mt-10 space-y-4">
                {[
                  {
                    icon: Users,
                    title: 'Skill-based matching',
                    text: 'Discover people whose learning goals align with your expertise.',
                  },
                  {
                    icon: Zap,
                    title: 'Fast collaboration',
                    text: 'Start real conversations and skill swaps without friction.',
                  },
                  {
                    icon: CheckCircle2,
                    title: 'Verified community',
                    text: 'Build credibility through profiles, ratings, and completed swaps.',
                  },
                ].map((item) => {
                  const Icon = item.icon

                  return (
                    <div
                      className="flex items-start gap-4 rounded-2xl border border-slate-200/70 bg-white/70 px-5 py-4 backdrop-blur-sm transition-all dark:border-slate-800 dark:bg-slate-900/60"
                      key={item.title}
                    >
                      <div className="rounded-xl border border-brand-200/50 bg-brand-50 p-2.5 text-brand-700 dark:border-brand-500/20 dark:bg-brand-500/10 dark:text-brand-300">
                        <Icon className="size-5" />
                      </div>

                      <div>
                        <h3 className="text-sm font-semibold text-slate-900 dark:text-white">
                          {item.title}
                        </h3>
                        <p className="mt-1 text-sm leading-6 text-slate-600 dark:text-slate-400">
                          {item.text}
                        </p>
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>

            <div className="mt-10 flex flex-wrap items-center gap-3 text-sm text-slate-500 dark:text-slate-400">
              <div className="rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/70">
                1,200+ active learners
              </div>

              <div className="rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/70">
                40+ skill categories
              </div>

              <div className="rounded-full border border-slate-200/70 bg-white/80 px-4 py-2 dark:border-slate-800 dark:bg-slate-900/70">
                Real peer-to-peer learning
              </div>
            </div>
          </div>
        </section>

        <section className="glass-panel p-6 sm:p-8">
          {!isSupabaseConfigured ? (
            <p className="rounded-2xl bg-amber-50 px-4 py-3 text-sm text-amber-800 dark:bg-amber-500/10 dark:text-amber-100">
              Supabase auth is not configured. Add <code>VITE_SUPABASE_URL</code> and{' '}
              <code>VITE_SUPABASE_ANON_KEY</code> in <code>.env</code> to enable sign-up and
              sign-in.
            </p>
          ) : null}

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
                  setNotice('')
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
              disabled={loading || authLoading || !isSupabaseConfigured}
              fullWidth
              onClick={async () => {
                setLoading(true)
                setError('')
                setNotice('')
                try {
                  const result = await loginWithGoogle()
                  if (result.success) {
                    navigate('/dashboard', { replace: true })
                  } else {
                    setError(result.message ?? 'Google sign-in failed.')
                  }
                } catch (error) {
                  console.error('Google login error:', error)
                  setError('Network error — check your connection')
                } finally {
                  setLoading(false)
                }
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
                  setNotice('')
                  try {
                    const result = await signUp(signupForm)
                    if (!result.success) {
                      if (
                        result.message?.includes('already registered') ||
                        result.message?.includes('already in use')
                      ) {
                        setError('Email already in use')
                      } else {
                        setError(result.message ?? 'Could not create your account.')
                      }
                      return
                    }
                    if (result.message) {
                      setNotice(result.message)
                    }
                    if (result.shouldNavigate) {
                      navigate('/settings', { replace: true })
                    }
                  } catch (error) {
                    console.error('Sign up error:', error)
                    setError('Network error — check your connection')
                  } finally {
                    setLoading(false)
                  }
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
                {notice ? (
                  <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700 dark:bg-emerald-500/10 dark:text-emerald-100">
                    {notice}
                  </p>
                ) : null}
                <Button disabled={loading || authLoading} fullWidth size="lg" type="submit">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      {tab === 'signup' ? 'Creating account...' : 'Signing in...'}
                    </>
                  ) : (
                    <>
                      {tab === 'signup' ? (
                        <>
                          <ArrowRight className="mr-2 h-4 w-4" />
                          Create account
                        </>
                      ) : (
                        <>
                          <LockKeyhole className="mr-2 h-4 w-4" />
                          Log in
                        </>
                      )}
                    </>
                  )}
                </Button>
              </form>
            ) : (
              <form
                className="space-y-4"
                onSubmit={async (event) => {
                  event.preventDefault()
                  setLoading(true)
                  setError('')
                  setNotice('')
                  try {
                    const result = await login(loginForm)
                    if (!result.success) {
                      if (result.message?.includes('Invalid login credentials')) {
                        setError('Wrong password')
                      } else {
                        setError(result.message ?? 'Could not log you in.')
                      }
                      return
                    }
                    if (result.shouldNavigate) {
                      navigate(redirectPath, { replace: true })
                    }
                  } catch (error) {
                    console.error('Login error:', error)
                    setError('Network error — check your connection')
                  } finally {
                    setLoading(false)
                  }
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
                <div className="flex justify-end">
                  <Link
                    className="text-sm font-semibold text-brand-600 dark:text-brand-300"
                    to="/forgot-password"
                  >
                    Forgot password?
                  </Link>
                </div>
                {error ? (
                  <p className="rounded-2xl bg-rose-50 px-4 py-3 text-sm text-rose-700 dark:bg-rose-500/10 dark:text-rose-200">
                    {error}
                  </p>
                ) : null}
                <Button disabled={loading || authLoading} fullWidth size="lg" type="submit">
                  {loading ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Signing in...
                    </>
                  ) : (
                    <>
                      <LockKeyhole className="mr-2 h-4 w-4" />
                      Log in
                    </>
                  )}
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
