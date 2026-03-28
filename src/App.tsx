import { Suspense, lazy } from 'react'
import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AppProvider, useApp } from '@/context/AppContext'

const LandingPage = lazy(async () =>
  import('@/pages/LandingPage').then((module) => ({ default: module.LandingPage })),
)
const AuthPage = lazy(async () =>
  import('@/pages/AuthPage').then((module) => ({ default: module.AuthPage })),
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
const NotFoundPage = lazy(async () =>
  import('@/pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
)

function RouteFallback() {
  return (
    <div className="page-shell">
      <div className="glass-panel flex min-h-[40vh] items-center justify-center p-8">
        <p className="text-sm font-medium text-slate-500 dark:text-slate-300">
          Loading SkillBridge...
        </p>
      </div>
    </div>
  )
}

function ProtectedLayout() {
  const { isAuthenticated } = useApp()

  if (!isAuthenticated) {
    return <Navigate replace to="/auth" />
  }

  return <Outlet />
}

function AnimatedRoutes() {
  const location = useLocation()

  return (
    <Suspense fallback={<RouteFallback />}>
      <AnimatePresence mode="wait">
        <Routes location={location} key={location.pathname}>
          <Route element={<LandingPage />} path="/" />
          <Route element={<AuthPage />} path="/auth" />

          <Route element={<AppShell />}>
            <Route element={<ExplorePage />} path="/explore" />
            <Route element={<ProfilePage />} path="/profile/:username" />
            <Route element={<PostPage />} path="/post" />

            <Route element={<ProtectedLayout />}>
              <Route element={<DashboardPage />} path="/dashboard" />
              <Route element={<ChatPage />} path="/messages" />
              <Route element={<ChatPage />} path="/messages/:threadId" />
              <Route element={<ChatPage />} path="/chat/:swapId" />
              <Route element={<NotificationsPage />} path="/notifications" />
              <Route element={<SettingsPage />} path="/settings" />
            </Route>
          </Route>

          <Route element={<NotFoundPage />} path="*" />
        </Routes>
      </AnimatePresence>
    </Suspense>
  )
}

function App() {
  return (
    <AppProvider>
      <BrowserRouter
        future={{
          v7_relativeSplatPath: true,
          v7_startTransition: true,
        }}
      >
        <AnimatedRoutes />
      </BrowserRouter>
    </AppProvider>
  )
}

export default App
