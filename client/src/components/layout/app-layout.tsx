import {
  BarChart3,
  BookOpen,
  History,
  LayoutDashboard,
  LogOut,
  Menu,
  MessageSquare,
  Mic,
  Settings,
  User2,
  X,
} from 'lucide-react'
import { useState, type ReactNode } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Logo } from '../brand/logo'
import { useAuth } from '../../lib/auth-context'
import { cn } from '../../lib/utils'

interface AppLayoutProps {
  children?: ReactNode
}

const navItems = [
  { label: 'Dashboard', path: '/app/dashboard', icon: LayoutDashboard },
  { label: 'Practice', path: '/app/practice', icon: Mic },
  { label: 'Introduction', path: '/app/exercise/professional-introduction', icon: User2 },
  { label: 'Read Aloud', path: '/app/exercise/read-aloud', icon: BookOpen },
  { label: 'Situational', path: '/app/exercise/situational-questions', icon: MessageSquare },
  { label: 'Progress', path: '/app/progress', icon: BarChart3 },
  { label: 'History', path: '/app/history', icon: History },
  { label: 'Settings', path: '/app/settings', icon: Settings },
]


export function AppLayout({ children }: AppLayoutProps) {
  const { user, logout, isLoading } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const [mobileOpen, setMobileOpen] = useState(false)

  const handleLogout = async () => {
    await logout()
    navigate('/sign-in')
  }

  // Get user initials
  const initials = user?.name
    ? user.name
        .split(' ')
        .map((p) => p[0])
        .join('')
        .toUpperCase()
        .slice(0, 2)
    : user?.email
      ? user.email.slice(0, 2).toUpperCase()
      : 'PH'

  return (
    <div className="flex min-h-screen bg-canvas text-ink antialiased">
      {/* Desktop Sidebar */}
      <aside className="sticky top-0 hidden h-screen w-64 flex-col border-r border-line bg-white p-5 md:flex">
        <div className="flex items-center justify-between pb-6">
          <Logo />
        </div>

        {/* Navigation list */}
        <nav className="flex-1 space-y-1.5" aria-label="App Navigation">
          {navItems.map((item) => {
            const Icon = item.icon
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/app/dashboard' && location.pathname.startsWith(item.path))
            return (
              <Link
                key={item.path}
                to={item.path}
                className={cn(
                  'group flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium transition-colors',
                  isActive
                    ? 'bg-primary-soft text-primary font-semibold'
                    : 'text-muted hover:bg-canvas hover:text-ink',
                )}
              >
                <Icon
                  className={cn(
                    'size-5 transition-colors',
                    isActive ? 'text-primary' : 'text-muted group-hover:text-ink',
                  )}
                />
                <span>{item.label}</span>
              </Link>
            )
          })}
        </nav>

        {/* User Profile Pill */}
        <div className="pt-4 border-t border-line">
          {isLoading ? (
            <div className="h-12 w-full animate-pulse rounded-xl bg-canvas" />
          ) : user ? (
            <div className="flex items-center justify-between rounded-xl bg-canvas p-2.5 border border-line/60">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary font-semibold text-xs text-white">
                  {initials}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-semibold text-ink">
                    {user.name || 'Member'}
                  </p>
                  <p className="truncate text-[11px] text-muted">{user.email}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={handleLogout}
                title="Log out"
                className="rounded-lg p-1.5 text-muted hover:bg-white hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                aria-label="Log out"
              >
                <LogOut className="size-4" />
              </button>
            </div>
          ) : (
            <Link
              to="/sign-in"
              className="flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white hover:bg-primary-hover"
            >
              Sign in
            </Link>
          )}
        </div>
      </aside>

      {/* Mobile Top Header */}
      <div className="flex flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-line bg-white/95 px-4 backdrop-blur-md md:hidden">
          <Logo />
          <button
            type="button"
            onClick={() => setMobileOpen(true)}
            className="grid size-10 place-items-center rounded-lg border border-line text-ink"
            aria-label="Open navigation menu"
          >
            <Menu className="size-5" />
          </button>
        </header>

        {/* Mobile Slide-Over Drawer */}
        {mobileOpen && (
          <div className="fixed inset-0 z-50 flex md:hidden">
            <div
              className="fixed inset-0 bg-ink/20 backdrop-blur-sm transition-opacity"
              onClick={() => setMobileOpen(false)}
            />
            <div className="relative flex w-72 max-w-[80vw] flex-col bg-white p-5 shadow-2xl">
              <div className="flex items-center justify-between pb-6">
                <Logo />
                <button
                  type="button"
                  onClick={() => setMobileOpen(false)}
                  className="rounded-lg p-1.5 text-muted hover:text-ink"
                  aria-label="Close menu"
                >
                  <X className="size-5" />
                </button>
              </div>

              <nav className="flex-1 space-y-1">
                {navItems.map((item) => {
                  const Icon = item.icon
                  const isActive =
                    location.pathname === item.path ||
                    (item.path !== '/app/dashboard' && location.pathname.startsWith(item.path))
                  return (
                    <Link
                      key={item.path}
                      to={item.path}
                      onClick={() => setMobileOpen(false)}
                      className={cn(
                        'flex items-center gap-3 rounded-xl px-3.5 py-2.5 text-sm font-medium',
                        isActive
                          ? 'bg-primary-soft text-primary font-semibold'
                          : 'text-muted hover:bg-canvas hover:text-ink',
                      )}
                    >
                      <Icon className="size-5" />
                      <span>{item.label}</span>
                    </Link>
                  )
                })}
              </nav>

              <div className="pt-4 border-t border-line">
                {user ? (
                  <div className="flex items-center justify-between rounded-xl bg-canvas p-2.5 border border-line">
                    <div className="flex items-center gap-2.5 overflow-hidden">
                      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-primary text-xs font-semibold text-white">
                        {initials}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-xs font-semibold text-ink">{user.name}</p>
                        <p className="truncate text-[11px] text-muted">{user.email}</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="rounded-lg p-1.5 text-muted hover:text-ink"
                    >
                      <LogOut className="size-4" />
                    </button>
                  </div>
                ) : (
                  <Link
                    to="/sign-in"
                    className="flex items-center justify-center rounded-xl bg-primary px-3 py-2 text-xs font-semibold text-white"
                  >
                    Sign in
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Main Workspace Body */}
        <main className="flex-1 overflow-y-auto px-4 py-6 sm:px-8 sm:py-8">
          <div className="mx-auto max-w-5xl">{children}</div>
        </main>
      </div>
    </div>
  )
}
