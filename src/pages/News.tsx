import {useEffect, useState} from 'react'
import {fetchNewsPosts, type SanityNewsPost} from '@/lib/newsFromSanity'

type NewsItem = {
  id: string
  date: string
  title: string
  body: string
  image: string
}

function mapSanityToItems(rows: SanityNewsPost[]): NewsItem[] {
  return rows
    .filter((r) => r._id && r.title)
    .map((r) => ({
      id: r._id,
      date: (r.date ?? '').slice(0, 10) || '1970-01-01',
      title: r.title ?? '',
      body: r.body ?? '',
      image: r.coverUrl ?? '',
    }))
}

function formatNewsDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function News() {
  const [items, setItems] = useState<NewsItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false
    ;(async () => {
      setLoading(true)
      setError(null)
      try {
        const rows = await fetchNewsPosts()
        if (!cancelled) setItems(mapSanityToItems(rows))
      } catch (e) {
        if (!cancelled) {
          const msg = e instanceof Error ? e.message : String(e)
          setError(
            `${msg} — If you are fetching from the browser, check sanity.io/manage → API → CORS origins and make sure this site's origin (e.g. http://localhost:5173) is added.`,
          )
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  return (
    <main className="min-w-0 px-6">
      <div className="mx-auto w-full min-w-0 max-w-page pt-page-below-nav pb-25">
       

        {loading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : error ? (
          <p className="max-w-prose text-sm leading-relaxed text-destructive" role="alert">
            {error}
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No news has been published yet. Add a `newsPost` in `/admin` or check it in Studio.
          </p>
        ) : (
          <ul className="grid min-w-0 list-none grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
            {items.map((item) => (
              <li key={item.id} className="min-w-0">
                <article className="flex min-w-0 flex-col gap-1.5">
                  <div className="aspect-square w-full min-w-0 overflow-hidden rounded-sm bg-muted">
                    {item.image ? (
                      <img
                        src={item.image}
                        alt=""
                        className="h-full w-full object-cover"
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div
                        className="flex h-full w-full items-center justify-center text-xs text-muted-foreground"
                        aria-hidden
                      >
                        No image
                      </div>
                    )}
                  </div>
                  <h2 className="text-xl font-medium leading-snug tracking-tight text-foreground">
                    {item.title}
                  </h2>
                  <time dateTime={item.date} className="text-sm text-muted-foreground">
                    {formatNewsDate(item.date)}
                  </time>
                  <p className="text-sm leading-relaxed text-foreground/90">{item.body}</p>
                </article>
              </li>
            ))}
          </ul>
        )}
      </div>
    </main>
  )
}
