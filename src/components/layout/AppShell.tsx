import { motion } from 'framer-motion'
import {
  Bell,
  ChevronDown,
  LayoutDashboard,
  LogOut,
  MessageSquareMore,
  PencilLine,
  Settings,
  Sparkles,
  UserRound,
} from 'lucide-react'
import { NavLink, Outlet, useLocation } from 'react-router-dom'
import { AppLogo } from '@/components/common/AppLogo'
import { ThemeToggle } from '@/components/common/ThemeToggle'
import { useApp } from '@/context/AppContext'
import { cn } from '@/utils/cn'

const navItems = [
  { to: '/explore', label: 'Explore', icon: Sparkles },
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/messages', label: 'Messages', icon: MessageSquareMore },
  { to: '/post', label: 'Community', icon: PencilLine },
] as const

export function AppShell() {
  const location = useLocation()
  const { currentUser, logout, unreadNotificationCount } = useApp()
  const profileRoute = currentUser ? `/profile/${currentUser.username}` : '/settings'

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-40 border-b border-slate-200/70 bg-white/75 backdrop-blur-xl dark:border-slate-800/80 dark:bg-slate-950/75">
        <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-4 px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex min-w-0 items-center gap-4">
            <AppLogo to={currentUser ? '/dashboard' : '/'} />
            <nav className="hidden items-center gap-2 lg:flex">
              {navItems.map((item) => {
                const Icon = item.icon
                const active = location.pathname.startsWith(item.to)
                return (
                  <NavLink
                    className={cn(
                      'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                      active
                        ? 'bg-indigo-600 text-white shadow-soft'
                        : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white',
                    )}
                    key={item.to}
                    to={item.to}
                  >
                    <Icon className="size-4" />
                    {item.label}
                  </NavLink>
                )
              })}
              <NavLink
                className={({ isActive }) =>
                  cn(
                    'inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition',
                    isActive
                      ? 'bg-indigo-600 text-white shadow-soft'
                      : 'text-slate-600 hover:bg-slate-100 hover:text-slate-950 dark:text-slate-300 dark:hover:bg-slate-800/80 dark:hover:text-white',
                  )
                }
                to={profileRoute}
              >
                {currentUser?.photo ? (
                  <img
                    src={currentUser.photo}
                    alt={currentUser.name}
                    className="size-7 rounded-xl object-cover ring-2 ring-white/20"
                  />
                ) : (
                  <UserRound className="size-4" />
                )}
                <span>{currentUser?.name?.split(' ')[0] ?? 'Profile'}</span>
              </NavLink>
            </nav>
          </div>

          <div className="flex items-center gap-3">
            <ThemeToggle
              className="rounded-full border-slate-200/70 bg-white/70 px-3 shadow-soft dark:border-slate-700 dark:bg-slate-900/70"
              showLabel={false}
            />

            <NavLink
              className="relative inline-flex size-11 items-center justify-center rounded-full border border-slate-200 bg-white/70 text-slate-700 shadow-soft transition hover:border-indigo-300 hover:text-indigo-700 dark:border-slate-700 dark:bg-slate-900/70 dark:text-slate-200 dark:hover:border-indigo-400 dark:hover:text-indigo-200"
              to="/notifications"
            >
              <Bell className="size-5" />
              {unreadNotificationCount > 0 ? (
                <span className="absolute right-2.5 top-2.5 inline-flex min-w-4 justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
                  {unreadNotificationCount}
                </span>
              ) : null}
            </NavLink>

            {currentUser ? (
              <details className="group relative">
                <summary className="flex list-none cursor-pointer items-center gap-3 rounded-full border border-slate-200 bg-white/75 px-2 py-2 text-left shadow-soft transition hover:border-brand-300 dark:border-slate-700 dark:bg-slate-900/75">
                  <img
                    alt={currentUser.name}
                    className="size-10 rounded-full object-cover"
                    src={currentUser.photo}
                  />
                  <div className="hidden pr-1 md:block">
                    <p className="text-sm font-semibold text-slate-950 dark:text-white">
                      {currentUser.name}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">
                      @{currentUser.username}
                    </p>
                  </div>
                  <ChevronDown className="size-4 text-slate-400 transition group-open:rotate-180" />
                </summary>

                <div className="absolute right-0 top-[calc(100%+0.75rem)] w-64 overflow-hidden rounded-[1.5rem] border border-slate-200 bg-white/95 p-2 shadow-[0_24px_60px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700 dark:bg-slate-900/95">
                  <NavLink
                    className={({ isActive }) =>
                      cn(
                        'flex flex-col items-center gap-1 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition',
                        isActive
                          ? 'bg-indigo-600 text-white shadow-soft'
                          : 'hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80',
                      )
                    }
                    to={profileRoute}
                  >
                    <UserRound className="size-4" />
                    View Profile
                  </NavLink>
                  <NavLink
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition',
                        isActive
                          ? 'bg-indigo-600 text-white shadow-soft'
                          : 'hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80',
                      )
                    }
                    to="/messages"
                  >
                    <MessageSquareMore className="size-4" />
                    Messages
                  </NavLink>
                  <NavLink
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 transition',
                        isActive
                          ? 'bg-indigo-600 text-white shadow-soft'
                          : 'hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-slate-800/80',
                      )
                    }
                    to="/settings"
                  >
                    <Settings className="size-4" />
                    Settings
                  </NavLink>
                  <button
                    className="flex w-full items-center gap-3 rounded-2xl px-4 py-3 text-sm font-semibold text-rose-600 transition hover:bg-rose-50 dark:text-rose-300 dark:hover:bg-rose-500/10"
                    onClick={() => {
                      void logout()
                    }}
                    type="button"
                  >
                    <LogOut className="size-4" />
                    Logout
                  </button>
                </div>
              </details>
            ) : null}
          </div>
        </div>
      </header>

      <main className="page-shell">
        <Outlet />
      </main>

      <motion.nav
        animate={{ y: 0 }}
        className="fixed inset-x-4 bottom-4 z-40 rounded-[1.75rem] border border-white/50 bg-white/92 p-2 shadow-[0_18px_40px_rgba(15,23,42,0.12)] backdrop-blur-xl dark:border-slate-700/70 dark:bg-slate-950/90 lg:hidden"
        initial={{ y: 60 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
      >
        <div className="grid grid-cols-5 gap-2">
          {[...navItems, { to: profileRoute, label: 'Profile', icon: UserRound }].map((item) => {
            const Icon = item.icon
            const active = location.pathname.startsWith(item.to)
            return (
              <NavLink
                className={cn(
                  'flex flex-col items-center gap-1 rounded-2xl py-2 text-[11px] font-semibold transition',
                  active
                    ? 'bg-slate-900 text-white shadow-soft dark:bg-white dark:text-slate-950'
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
