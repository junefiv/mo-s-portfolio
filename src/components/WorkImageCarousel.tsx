import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type PointerEvent,
  type TransitionEvent,
} from 'react'

const SWIPE_MIN_PX = 40
const TRANSITION_MS = 500

type WorkImageCarouselProps = {
  images: string[]
  label: string
  index: number
  onIndexChange: (index: number) => void
}

/**
 * n>1: slides = [ lastClone, ...images, firstClone ] — loop keeps same “next” direction.
 * trackPos: 0 = last clone, 1..n = real, n+1 = first clone. Logical index 0..n-1 = trackPos − 1
 */
export default function WorkImageCarousel({
  images,
  label,
  index,
  onIndexChange,
}: WorkImageCarouselProps) {
  const n = images.length
  const startRef = useRef<{ x: number; y: number; id: number } | null>(null)
  const prevIndexRef = useRef(index)
  const [trackPos, setTrackPos] = useState(() => (n > 1 ? index + 1 : 0))
  const [noTransition, setNoTransition] = useState(true)

  const looped = n > 1
  const m = looped ? n + 2 : n
  const extended = looped
    ? [images[n - 1]!, ...images, images[0]!]
    : images

  useLayoutEffect(() => {
    if (n > 1) setNoTransition(false)
  }, [n])

  useEffect(() => {
    if (n === 0) return
    if (n === 1) {
      prevIndexRef.current = index
      return
    }

    const prev = prevIndexRef.current
    if (index === prev) return

    setNoTransition(false)
    if (prev === n - 1 && index === 0) {
      setTrackPos(n + 1)
    } else if (prev === 0 && index === n - 1) {
      setTrackPos(0)
    } else {
      setTrackPos(index + 1)
    }
    prevIndexRef.current = index
  }, [index, n])

  const goNext = useCallback(() => {
    if (n <= 1) return
    onIndexChange((index + 1) % n)
  }, [n, index, onIndexChange])

  const goPrev = useCallback(() => {
    if (n <= 1) return
    onIndexChange((index - 1 + n) % n)
  }, [n, index, onIndexChange])

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (n <= 1) return
    e.currentTarget.setPointerCapture(e.pointerId)
    startRef.current = { x: e.clientX, y: e.clientY, id: e.pointerId }
  }

  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!startRef.current || n <= 1) {
      startRef.current = null
      return
    }
    if (e.pointerId !== startRef.current.id) return
    try {
      e.currentTarget.releasePointerCapture(e.pointerId)
    } catch {
      /* already released */
    }
    const dx = e.clientX - startRef.current.x
    const dy = e.clientY - startRef.current.y
    startRef.current = null
    if (Math.abs(dx) < SWIPE_MIN_PX || Math.abs(dx) < Math.abs(dy)) return
    if (dx < 0) goNext()
    else goPrev()
  }

  const onTrackTransitionEnd = (e: TransitionEvent<HTMLDivElement>) => {
    if (!looped) return
    if (e.propertyName !== 'transform') return
    if (e.target !== e.currentTarget) return
    if (trackPos === n + 1) {
      setNoTransition(true)
      setTrackPos(1)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setNoTransition(false))
      })
    } else if (trackPos === 0) {
      setNoTransition(true)
      setTrackPos(n)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => setNoTransition(false))
      })
    }
  }

  if (n === 0) {
    return (
      <div
        className="aspect-[3/4] min-h-0 w-full min-w-0 rounded-sm bg-gray-100"
        aria-label={label}
      />
    )
  }

  if (n === 1) {
    return (
      <div
        className="relative min-h-0 w-full min-w-0 [touch-action:manipulation] select-none"
        aria-label={label}
      >
        <div className="relative aspect-[3/4] w-full min-w-0 overflow-hidden rounded-sm bg-gray-100">
          <img
            src={images[0]!}
            alt=""
            className="h-full w-full object-cover"
            loading="eager"
            draggable={false}
          />
        </div>
      </div>
    )
  }

  return (
    <div
      className="group relative min-h-0 w-full min-w-0 [touch-action:manipulation] select-none"
      aria-label={label}
    >
      <div
        role="presentation"
        onPointerDown={onPointerDown}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        className="relative aspect-[3/4] w-full min-w-0 cursor-grab overflow-hidden rounded-sm bg-gray-100 active:cursor-grabbing"
      >
        <div
          onTransitionEnd={onTrackTransitionEnd}
          className="flex h-full min-w-0 flex-row will-change-transform"
          style={{
            width: `${m * 100}%`,
            transform: `translateX(calc(-100% * ${trackPos} / ${m}))`,
            transition: noTransition
              ? 'none'
              : `transform ${TRANSITION_MS}ms cubic-bezier(0.32, 0.72, 0, 1)`,
          }}
        >
          {extended.map((src, i) => (
            <div
              key={`${i}-${src}`}
              className="h-full min-w-0 shrink-0"
              style={{ width: `${100 / m}%` }}
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover"
                loading={i === 1 ? 'eager' : 'lazy'}
                draggable={false}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          goPrev()
        }}
        className="absolute left-0 top-0 z-10 flex h-full w-10 sm:w-12 items-center justify-center bg-gradient-to-r from-black/30 to-transparent text-white transition-opacity hover:from-black/50 max-md:pointer-events-auto max-md:opacity-100 md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
        aria-label="이전 이미지"
      >
        <span className="sr-only">이전</span>
        <svg
          className="pointer-events-none h-6 w-6 drop-shadow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path
            d="M15 6l-6 6 6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation()
          goNext()
        }}
        className="absolute right-0 top-0 z-10 flex h-full w-10 sm:w-12 items-center justify-center bg-gradient-to-l from-black/30 to-transparent text-white transition-opacity hover:from-black/50 max-md:pointer-events-auto max-md:opacity-100 md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100"
        aria-label="다음 이미지"
      >
        <span className="sr-only">다음</span>
        <svg
          className="pointer-events-none h-6 w-6 drop-shadow"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          aria-hidden
        >
          <path
            d="M9 6l6 6-6 6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>
    </div>
  )
}
