import { Logo } from '../brand/logo'
import { Container } from '../layout/container'

const groups = [
  {
    title: 'Product',
    links: [
      { href: '#features', label: 'Features' },
      { href: '#how-it-works', label: 'How it works' },
      { href: '#demo', label: 'Preview' },
    ],
  },
  {
    title: 'Audience',
    links: [
      { href: '#students', label: 'For students' },
      { href: '#institutions', label: 'For institutions' },
      { href: '#faq', label: 'FAQ' },
    ],
  },
]

export function Footer() {
  return (
    <footer className="border-t border-line bg-white">
      <Container className="grid gap-10 py-12 sm:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <Logo />
          <p className="mt-4 max-w-xs text-sm leading-6 text-muted">
            Communication practice for students. Phase 1 is the public site. Recording and scoring are not
            live yet.
          </p>
        </div>
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-sm font-semibold text-ink">{group.title}</p>
            <ul className="mt-3 space-y-2">
              {group.links.map((link) => (
                <li key={link.href}>
                  <a
                    href={link.href}
                    className="text-sm text-muted transition-colors hover:text-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    {link.label}
                  </a>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </Container>
      <Container className="border-t border-line py-5">
        <p className="text-xs text-subtle">© {new Date().getFullYear()} PrepHelp. Sample interface content only.</p>
      </Container>
    </footer>
  )
}
