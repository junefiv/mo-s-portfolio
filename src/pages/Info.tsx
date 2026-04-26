import {Link} from 'react-router'

export default function Info() {
  return (
    <main className="px-6">
      <div className="mx-auto w-full min-w-0 max-w-page pt-page-below-nav pb-20">
        <h1 className="mb-8 text-5xl tracking-tight md:text-7xl">INFO</h1>
        
        <Link
          to="/admin"
          className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-md border border-border bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.99]"
        >
          어드민 (콘텐츠 등록)
        </Link>
      </div>
    </main>
  )
}
