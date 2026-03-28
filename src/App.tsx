import { AnimatePresence } from 'framer-motion'
import { BrowserRouter, Navigate, Outlet, Route, Routes, useLocation } from 'react-router-dom'
import { AppShell } from '@/components/layout/AppShell'
import { AppProvider, useApp } from '@/context/AppContext'
import { AuthPage } from '@/pages/AuthPage'
import { ChatPage } from '@/pages/ChatPage'
import { DashboardPage } from '@/pages/DashboardPage'
import { ExplorePage } from '@/pages/ExplorePage'
import { LandingPage } from '@/pages/LandingPage'
import { NotFoundPage } from '@/pages/NotFoundPage'
import { NotificationsPage } from '@/pages/NotificationsPage'
import { PostPage } from '@/pages/PostPage'
import { ProfilePage } from '@/pages/ProfilePage'
import { SettingsPage } from '@/pages/SettingsPage'

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
            <Route element={<ChatPage />} path="/chat/:swapId" />
            <Route element={<NotificationsPage />} path="/notifications" />
            <Route element={<SettingsPage />} path="/settings" />
          </Route>
        </Route>

        <Route element={<NotFoundPage />} path="*" />
      </Routes>
    </AnimatePresence>
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
