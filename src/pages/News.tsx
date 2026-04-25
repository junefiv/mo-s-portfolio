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
  return d.toLocaleDateString('ko-KR', {
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
            `${msg} — 브라우저에서 Sanity API를 쓰려면 sanity.io/manage → API → CORS origins에 이 사이트 주소(예: http://localhost:5173)를 등록했는지 확인하세요.`,
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
    <main className="min-w-0 px-6 pt-20">
      <div className="mx-auto w-full min-w-0 max-w-page py-25">
        <h1 className="mb-10 text-4xl font-semibold tracking-tight text-foreground sm:mb-12 sm:text-5xl md:text-6xl">
          NEWS
        </h1>

        {loading ? (
          <p className="text-sm text-muted-foreground">불러오는 중…</p>
        ) : error ? (
          <p className="max-w-prose text-sm leading-relaxed text-destructive" role="alert">
            {error}
          </p>
        ) : items.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            등록된 뉴스가 없습니다. /admin 에서 newsPost를 추가하거나 Studio에서 확인하세요.
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
                        이미지 없음
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
