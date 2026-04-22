import { Link, useLocation } from 'react-router'

export default function Navigation() {
  const location = useLocation()

  const links = [
    { path: '/', label: 'FAKT' },
    { path: '/academics', label: 'ACADEMICS' },
    { path: '/work', label: 'WORK' },
    { path: '/fabrication', label: 'FABRICATION' },
    { path: '/info', label: 'INFO' },
  ]

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white border-b border-black">
      <div className="max-w-screen-2xl mx-auto px-6 py-4">
        <ul className="flex items-center justify-between gap-8">
          {links.map((link) => {
            const isActive =
              link.path === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(link.path)

            return (
              <li key={link.path}>
                <Link
                  to={link.path}
                  className={`text-sm tracking-wide transition-opacity hover:opacity-60 ${
                    isActive ? 'opacity-100' : 'opacity-40'
                  }`}
                >
                  {link.label}
                </Link>
              </li>
            )
          })}
        </ul>
      </div>
    </nav>
  )
}
