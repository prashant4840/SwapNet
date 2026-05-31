import { Suspense, lazy, useEffect } from 'react'
import { AnimatePresence } from 'framer-motion'
import {
  BrowserRouter,
  Navigate,
  Outlet,
  Route,
  Routes,
  useLocation,
} from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { ErrorBoundary } from '@/components/common/ErrorBoundary'
import { AppProvider, useApp } from '@/context/AppContext'
import toast, { useToasterStore } from 'react-hot-toast'

const LandingPage = lazy(async () =>
  import('@/pages/LandingPage').then((module) => ({ default: module.LandingPage })),
)
const AuthPage = lazy(async () =>
  import('@/pages/AuthPage').then((module) => ({ default: module.AuthPage })),
)
const ForgotPasswordPage = lazy(async () =>
  import('@/pages/ForgotPasswordPage').then((module) => ({
    default: module.ForgotPasswordPage,
  })),
)
const ResetPasswordPage = lazy(async () =>
  import('@/pages/ResetPasswordPage').then((module) => ({
    default: module.ResetPasswordPage,
  })),
)
const ExplorePage = lazy(async () =>
  import('@/pages/ExplorePage').then((module) => ({ default: module.ExplorePage })),
)
const ProfilePage = lazy(async () =>
  import('@/pages/ProfilePage').then((module) => ({ default: module.ProfilePage })),
)
const PostPage = lazy(async () =>
  import('@/pages/PostPage').then((module) => ({ default: module.PostPage })),
)
const DashboardPage = lazy(async () =>
  import('@/pages/DashboardPage').then((module) => ({ default: module.DashboardPage })),
)
const ChatPage = lazy(async () =>
  import('@/pages/ChatPage').then((module) => ({ default: module.ChatPage })),
)
const NotificationsPage = lazy(async () =>
  import('@/pages/NotificationsPage').then((module) => ({ default: module.NotificationsPage })),
)
const SettingsPage = lazy(async () =>
  import('@/pages/SettingsPage').then((module) => ({ default: module.SettingsPage })),
)
const AdminPage = lazy(async () =>
  import('@/pages/AdminPage').then((module) => ({ default: module.AdminPage })),
)
const NotFoundPage = lazy(async () =>
  import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

function RouteFallback() {
  return (
    <div className="page-shell">
      <div className="glass-panel flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
          Loading SwapNet...
        </p>
      </div>
    </div>
  )
}

function ProtectedLayout() {
  const location = useLocation()
  const { isAuthenticated, loading } = useApp()

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 dark:bg-slate-900">
        <div className="flex flex-col items-center gap-3">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-violet-500 border-t-transparent" />
          <p className="text-sm text-slate-500 dark:text-slate-400">Loading SwapNet...</p>
        </div>
      </div>
    )
  }

  if (!isAuthenticated) {
    return <Navigate replace state={{ from: location.pathname }} to="/auth" />
  }

  return <Outlet />
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <Suspense fallback={<RouteFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<ErrorBoundary><LandingPage /></ErrorBoundary>} path="/" />
          <Route element={<ErrorBoundary><AuthPage /></ErrorBoundary>} path="/auth" />
          <Route
            element={<ErrorBoundary><ForgotPasswordPage /></ErrorBoundary>}
            path="/forgot-password"
          />
          <Route
            element={<ErrorBoundary><ResetPasswordPage /></ErrorBoundary>}
            path="/reset-password"
          />

          <Route element={<AppShell />}>
            <Route element={<ErrorBoundary><ExplorePage /></ErrorBoundary>} path="/explore" />
            <Route element={<ErrorBoundary><ProfilePage /></ErrorBoundary>} path="/profile/:username" />
            <Route element={<ErrorBoundary><PostPage /></ErrorBoundary>} path="/post" />

            <Route element={<ProtectedLayout />}>
              <Route element={<ErrorBoundary><DashboardPage /></ErrorBoundary>} path="/dashboard" />
              <Route element={<ErrorBoundary><ChatPage /></ErrorBoundary>} path="/messages" />
              <Route element={<ErrorBoundary><ChatPage /></ErrorBoundary>} path="/messages/:threadId" />
              <Route element={<ErrorBoundary><ChatPage /></ErrorBoundary>} path="/chat/:swapId" />
              <Route element={<ErrorBoundary><NotificationsPage /></ErrorBoundary>} path="/notifications" />
              <Route element={<ErrorBoundary><SettingsPage /></ErrorBoundary>} path="/settings" />
              <Route element={<ErrorBoundary><AdminPage /></ErrorBoundary>} path="/admin" />
            </Route>
          </Route>

          <Route element={<ErrorBoundary><NotFoundPage /></ErrorBoundary>} path="*" />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

function ToastLimitTracker() {
  const { toasts } = useToasterStore()

  useEffect(() => {
    const activeToasts = toasts.filter((t) => t.visible)
    if (activeToasts.length > 3) {
      const oldestToast = activeToasts[0]
      toast.dismiss(oldestToast.id)
    }
  }, [toasts])

  return null
}

function App() {
  return (
    <BrowserRouter
      future={{
        v7_relativeSplatPath: true,
        v7_startTransition: true,
      }}
    >
      <AppProvider>
        <ToastLimitTracker />
        <AnimatedRoutes />
      </AppProvider>
    </BrowserRouter>
  )
}

export default App
