import {Link} from 'react-router'
import {SITE_TITLE} from '@/siteMeta'

export default function NotFound() {
  return (
    <main className="px-6 pt-page-below-nav">
      <div className="mx-auto max-w-page">
        <h1 className="text-xl font-medium">Page not found</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This URL is not part of {SITE_TITLE}. Try one of the pages below.
        </p>
        <nav className="mt-6 text-sm" aria-label="Site">
          <ul className="list-none space-y-2">
            <li>
              <Link to="/" className="underline underline-offset-2">
                Work
              </Link>
            </li>
            <li>
              <Link to="/news" className="underline underline-offset-2">
                News
              </Link>
            </li>
            <li>
              <Link to="/info" className="underline underline-offset-2">
                Info
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </main>
  )
}
