import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type SetStateAction,
  type TransitionEvent,
} from 'react'
import WorkImageCarousel from '../components/WorkImageCarousel'
import {
  fabricationBodyToParagraphs,
  fetchFabricationEntries,
  type SanityFabricationEntry,
} from '@/lib/fabricationFromSanity'

type FabricationEntry = {
  id: string
  year: string
  title: string
  institution: string
  type: string
  paragraphs: string[]
  images: string[]
}

function mapSanityToEntry(r: SanityFabricationEntry): FabricationEntry | null {
  if (!r._id || !r.title) return null
  const images = (r.images ?? []).filter((u): u is string => !!u)
  if (!images.length) return null
  return {
    id: r._id,
    year: r.year ?? '',
    title: r.title ?? '',
    institution: r.subTitle ?? '',
    type: r.category ?? '',
    paragraphs: fabricationBodyToParagraphs(r.body ?? ''),
    images,
  }
}

export default function Fabrication() {
  const [entries, setEntries] = useState<FabricationEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [openId, setOpenId] = useState<string | null>(null)
  /** 닫힘 애니메이션 중에도 패널 DOM 유지 */
  const [mountedId, setMountedId] = useState<string | null>(null)
  /** grid-rows 1fr ↔ 0fr — 열림/닫힘 모두 전환 */
  const [panelExpanded, setPanelExpanded] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>({})

  const openIdRef = useRef(openId)
  const panelExpandedRef = useRef(panelExpanded)
  openIdRef.current = openId
  panelExpandedRef.current = panelExpanded

  const loadEntries = useCallback(async (opts?: {background?: boolean}) => {
    const bg = opts?.background === true
    if (!bg) {
      setLoading(true)
      setError(null)
    }
    try {
      const rows = await fetchFabricationEntries()
      const mapped = rows
        .map(mapSanityToEntry)
        .filter((e): e is FabricationEntry => e !== null)
      setEntries(mapped)
      if (!bg) setError(null)
    } catch (e) {
      if (!bg) setError(e instanceof Error ? e.message : String(e))
    } finally {
      if (!bg) setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadEntries()
  }, [loadEntries])

  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') void loadEntries({background: true})
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [loadEntries])

  useLayoutEffect(() => {
    if (openId) setMountedId(openId)
  }, [openId])

  useEffect(() => {
    if (!openId) return
    const raf = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPanelExpanded(true))
    })
    return () => cancelAnimationFrame(raf)
  }, [openId])

  /** transitionend 미발생(모션 감소 등) 시에도 패널 언마운트 */
  useEffect(() => {
    if (openId !== null || panelExpanded || mountedId === null) return
    const tid = window.setTimeout(() => setMountedId(null), 400)
    return () => window.clearTimeout(tid)
  }, [openId, panelExpanded, mountedId])

  const toggle = useCallback((id: string) => {
    setOpenId((prev) => {
      if (prev === id) {
        setPanelExpanded(false)
        return null
      }
      return id
    })
  }, [])

  const onPanelTransitionEnd = useCallback(
    (entryId: string) => (e: TransitionEvent<HTMLDivElement>) => {
      if (e.propertyName !== 'grid-template-rows') return
      if (e.target !== e.currentTarget) return
      if (panelExpandedRef.current) return
      if (openIdRef.current !== null) return
      setMountedId((m) => (m === entryId ? null : m))
    },
    [],
  )

  const onCarouselIndexChange = useCallback(
    (id: string, action: SetStateAction<number>) => {
      setCarouselIndex((prev) => ({
        ...prev,
        [id]: typeof action === 'function' ? action(prev[id] ?? 0) : action,
      }))
    },
    [],
  )

  if (loading) {
    return (
      <main className="min-w-0 px-6 pt-page-below-nav">
        <p className="mx-auto max-w-page text-sm text-muted-foreground">Loading…</p>
      </main>
    )
  }

  if (error) {
    return (
      <main className="min-w-0 px-6 pt-page-below-nav">
        <p className="mx-auto max-w-page text-sm text-destructive" role="alert">
          {error}
        </p>
      </main>
    )
  }

  if (entries.length === 0) {
    return (
      <main className="min-w-0 px-6 pt-page-below-nav">
        <p className="mx-auto max-w-page text-sm text-muted-foreground">
          No Fabrication items are available.
        </p>
      </main>
    )
  }

  return (
    <main className="min-w-0 px-6">
      <div className="mx-auto w-full min-w-0 max-w-page pt-page-below-nav pb-25">
        <div className="flex min-w-0 flex-col gap-1">
          {entries.map((entry) => {
            const isOpen = openId === entry.id
            const showPanel = mountedId === entry.id
            const gridOpen = showPanel && panelExpanded
            const imgIndex = carouselIndex[entry.id] ?? 0

            return (
              <section key={entry.id} className="min-w-0">
                <button
                  type="button"
                  id={`fab-trigger-${entry.id}`}
                  aria-expanded={isOpen}
                  aria-controls={`fab-panel-${entry.id}`}
                  onClick={() => toggle(entry.id)}
                  className="grid w-full min-w-0 cursor-pointer grid-cols-1 gap-6 border-t border-foreground pt-6 pb-8 text-left transition-opacity hover:opacity-60 md:grid-cols-4"
                >
                  <div className="text-sm text-foreground/60">{entry.year}</div>
                  <div className="min-w-0 md:col-span-2">
                    <h2 className="mb-2 text-2xl">{entry.title}</h2>
                    <p className="text-foreground/60">{entry.institution}</p>
                  </div>
                  <div className="text-sm text-foreground/60">{entry.type}</div>
                </button>

                <div
                  id={`fab-panel-${entry.id}`}
                  role="region"
                  aria-labelledby={`fab-trigger-${entry.id}`}
                  onTransitionEnd={onPanelTransitionEnd(entry.id)}
                  className={`grid min-w-0 transition-[grid-template-rows] duration-300 ease-in-out motion-reduce:transition-none ${
                    gridOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
                  }`}
                >
                  <div className="min-h-0 overflow-hidden">
                    {showPanel ? (
                      <div className="grid min-w-0 grid-cols-1 gap-6 pb-10 md:grid-cols-2 md:gap-8">
                        <div className="min-w-0 w-full max-w-md justify-self-start">
                          <WorkImageCarousel
                            images={entry.images}
                            label={`${entry.title} — image`}
                            index={imgIndex}
                            onIndexChange={(i) => onCarouselIndexChange(entry.id, i)}
                          />
                        </div>
                        <div className="min-w-0 space-y-4 text-base leading-relaxed text-foreground/90">
                          {entry.paragraphs.map((p, i) => (
                            <p key={i}>{p}</p>
                          ))}
                        </div>
                      </div>
                    ) : null}
                  </div>
                </div>
              </section>
            )
          })}
        </div>
      </div>
    </main>
  )
}
