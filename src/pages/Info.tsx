import {Link} from 'react-router'

export default function Info() {
  return (
    <main className="px-6">
      <div className="mx-auto w-full min-w-0 max-w-page pt-page-below-nav pb-20">
        <h1 className="mb-8 text-5xl tracking-tight md:text-7xl">INFO</h1>

        <p className="mb-10 max-w-xl text-sm leading-relaxed text-muted-foreground/80">
          by git_in means: 옷<strong className="font-bold text-muted-foreground">깃</strong>만 스쳐도{' '}
          <strong className="font-bold text-muted-foreground">인</strong>연 by 심준혁
        </p>

        <Link
          to="/admin"
          className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-md border border-border bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.99]"
        >
          Admin (Content Management)
        </Link>
      </div>
    </main>
  )
}
