import { Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { Logo } from '../brand/logo'
import { ButtonLink } from '../ui/button'
import { Container } from '../layout/container'
import { useAuth } from '../../lib/auth-context'
import { cn } from '../../lib/utils'

const links = [
  { id: 'features', label: 'Features' },
  { id: 'how-it-works', label: 'How it works' },
  { id: 'students', label: 'For Students' },
  { id: 'institutions', label: 'For Institutions' },
  { id: 'faq', label: 'FAQ' },
]

function sectionHref(pathname: string, id: string) {
  return pathname === '/' ? `#${id}` : `/#${id}`
}

export function Navbar() {
  const { user } = useAuth()
  const { pathname } = useLocation()
  const [scrolled, setScrolled] = useState(false)
  const [open, setOpen] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    setOpen(false)
  }, [pathname])

  useEffect(() => {
    if (!open) return
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false)
    }
    document.addEventListener('keydown', onKeyDown)
    return () => document.removeEventListener('keydown', onKeyDown)
  }, [open])

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-200',
        scrolled || open
          ? 'border-line bg-white/85 shadow-card backdrop-blur-md'
          : 'border-transparent bg-canvas/80 backdrop-blur-sm',
      )}
    >
      <Container className="flex h-16 items-center justify-between gap-4">
        <Logo />
        <nav className="hidden items-center gap-6 lg:flex" aria-label="Primary">
          {links.map((link) =>
            pathname === '/' ? (
              <a
                key={link.id}
                href={sectionHref(pathname, link.id)}
                className="group relative text-sm font-medium text-muted transition-colors duration-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-200 ease-out group-hover:scale-x-100" />
              </a>
            ) : (
              <Link
                key={link.id}
                to={sectionHref(pathname, link.id)}
                className="group relative text-sm font-medium text-muted transition-colors duration-200 hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
              >
                {link.label}
                <span className="absolute -bottom-1.5 left-0 h-px w-full origin-left scale-x-0 bg-primary transition-transform duration-200 ease-out group-hover:scale-x-100" />
              </Link>
            ),
          )}
        </nav>
        <div className="hidden items-center gap-2 sm:flex">
          {user ? (
            <ButtonLink to="/app/dashboard" size="sm" showArrow>
              Dashboard
            </ButtonLink>
          ) : (
            <>
              <ButtonLink to="/sign-in" variant="ghost" size="sm">
                Sign in
              </ButtonLink>
              <ButtonLink to="/get-started" size="sm" showArrow>
                Get started
              </ButtonLink>
            </>
          )}
        </div>
        <button
          type="button"
          className="grid size-11 place-items-center rounded-full border border-line bg-white text-ink lg:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? 'Close menu' : 'Open menu'}
          onClick={() => setOpen((value) => !value)}
        >
          {open ? <X className="size-5" aria-hidden /> : <Menu className="size-5" aria-hidden />}
        </button>
      </Container>
      {open ? (
        <div id="mobile-nav" className="border-t border-line bg-white lg:hidden">
          <Container className="flex flex-col gap-1 py-3">
            {links.map((link) =>
              pathname === '/' ? (
                <a
                  key={link.id}
                  href={sectionHref(pathname, link.id)}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {link.label}
                </a>
              ) : (
                <Link
                  key={link.id}
                  to={sectionHref(pathname, link.id)}
                  onClick={() => setOpen(false)}
                  className="rounded-xl px-3 py-3 text-sm font-medium text-ink hover:bg-canvas focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                >
                  {link.label}
                </Link>
              ),
            )}
            <div className="mt-2 flex flex-col gap-2 sm:hidden">
              {user ? (
                <ButtonLink to="/app/dashboard" showArrow>
                  Go to Dashboard
                </ButtonLink>
              ) : (
                <>
                  <ButtonLink to="/sign-in" variant="secondary">
                    Sign in
                  </ButtonLink>
                  <ButtonLink to="/get-started" showArrow>
                    Get started
                  </ButtonLink>
                </>
              )}
            </div>
          </Container>
        </div>
      ) : null}
    </header>
  )
}
