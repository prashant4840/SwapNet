import { motion } from 'framer-motion'
import {
  Bell,
  Compass,
  LayoutDashboard,
  LogOut,
  PencilLine,
  Settings,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useApp } from '@/context/AppContext'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/explore', label: 'Explore', icon: Compass },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/post', label: 'Board', icon: PencilLine },
  { to: '/notifications', label: 'Alerts', icon: Bell },
  { to: '/settings', label: 'Settings', icon: Settings },
]

export function AppShell() {
  const location = useLocation()
  const { currentUser, logout, unreadNotificationCount } = useApp()

  return (
    <div className="page-shell">
      <div className="app-grid">
        <aside className="hidden lg:block">
          <div className="glass-panel sticky top-6 flex min-h-[calc(100vh-3rem)] flex-col p-5">
            <div className="space-y-5">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-300">
                  SkillBridge
                </p>
                <h1 className="mt-3 text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                  Swap what you know for what you want next.
                </h1>
              </div>

              <nav className="space-y-2">
                {navItems.map((item) => {
                  const Icon = item.icon
                  return (
                    <NavLink
                      className={({ isActive }) =>
                        cn(
                          'flex items-center justify-between rounded-2xl px-4 py-3 text-sm font-semibold transition',
                          isActive
                            ? 'bg-slate-900 text-white shadow-soft dark:bg-white dark:text-slate-900'
                            : 'text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800/80',
                        )
                      }
                      key={item.to}
                      to={item.to}
                    >
                      <span className="inline-flex items-center gap-3">
                        <Icon className="size-4" />
                        {item.label}
                      </span>
                      {item.to === '/notifications' && unreadNotificationCount > 0 ? (
                        <span className="rounded-full bg-brand-500 px-2 py-0.5 text-xs text-white">
                          {unreadNotificationCount}
                        </span>
                      ) : null}
                    </NavLink>
                  )
                })}
              </nav>
            </div>

            <div className="mt-auto space-y-4">
              <ThemeToggle />
              {currentUser ? (
                <div className="rounded-3xl bg-slate-100/80 p-4 dark:bg-slate-800/80">
                  <div className="flex items-center gap-3">
                    <img
                      alt={currentUser.name}
                      className="size-12 rounded-2xl object-cover"
                      src={currentUser.photo}
                    />
                    <div>
                      <p className="font-semibold text-slate-950 dark:text-white">
                        {currentUser.name}
                      </p>
                      <p className="text-sm text-slate-500 dark:text-slate-300">
                        @{currentUser.username}
                      </p>
                    </div>
                  </div>
                  <button
                    className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-950 dark:text-slate-300 dark:hover:text-white"
                    onClick={logout}
                    type="button"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </div>
              ) : null}
            </div>
          </div>
        </aside>

        <div className="min-w-0">
          <header className="mb-6 flex items-center justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.24em] text-brand-600 dark:text-brand-300">
                Community Exchange
              </p>
              <h2 className="text-2xl font-bold tracking-tight text-slate-950 dark:text-white">
                {navItems.find((item) => location.pathname.startsWith(item.to))?.label ?? 'Profile'}
              </h2>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              {currentUser ? (
                <NavLink
                  className="relative inline-flex rounded-2xl border border-slate-200 bg-white/80 p-3 dark:border-slate-700 dark:bg-slate-900/80"
                  to="/notifications"
                >
                  <Bell className="size-5" />
                  {unreadNotificationCount > 0 ? (
                    <span className="absolute right-2 top-2 size-2 rounded-full bg-rose-500" />
                  ) : null}
                </NavLink>
              ) : null}
            </div>
          </header>

          <Outlet />
        </div>
      </div>

      <motion.nav
        animate={{ y: 0 }}
        className="fixed inset-x-4 bottom-4 z-40 rounded-3xl border border-white/40 bg-white/90 p-2 shadow-soft backdrop-blur-xl dark:border-slate-700/60 dark:bg-slate-950/90 lg:hidden"
        initial={{ y: 60 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="grid grid-cols-5 gap-2">
          {navItems.map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.to)
            return (
              <NavLink
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition',
                  active
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-950'
                    : 'text-slate-500 dark:text-slate-300',
                )}
                key={item.to}
                to={item.to}
              >
                <Icon className="size-4" />
                {item.label}
              </NavLink>
            )
          })}
        </div>
      </motion.nav>
    </div>
  )
}
