import {
  useCallback,
  useLayoutEffect,
  useRef,
  useState,
  type Dispatch,
  type PointerEvent,
  type SetStateAction,
  type SyntheticEvent,
  type TransitionEvent,
} from 'react'

const SWIPE_MIN_PX = 40
const TRANSITION_MS = 500

/** 정사각 + object-contain: 세로가 길면 좌우가 #fff → 검은 화살표, 그 외는 이미지가 옆까지 닿음 → 흰 화살표 */
function shouldUseBlackArrows(
  activeSrc: string | undefined,
  dimsBySrc: Record<string, { w: number; h: number }>,
) {
  if (!activeSrc) return false
  const d = dimsBySrc[activeSrc]
  if (!d?.w || !d?.h) return false
  return d.w < d.h
}

function recordNaturalSize(
  setDims: Dispatch<
    SetStateAction<Record<string, { w: number; h: number }>>
  >,
  src: string,
) {
  return (e: SyntheticEvent<HTMLImageElement>) => {
    const { naturalWidth: w, naturalHeight: h } = e.currentTarget
    if (w < 1 || h < 1) return
    setDims((prev) => {
      const cur = prev[src]
      if (cur?.w === w && cur?.h === h) return prev
      return { ...prev, [src]: { w, h } }
    })
  }
}

type WorkImageCarouselProps = {
  images: string[]
  label: string
  index: number
  /** `useState`의 setter처럼 숫자 또는 `(prev) => next` — 래핑 시 클로저 `index` 지연 없이 동작 */
  onIndexChange: Dispatch<SetStateAction<number>>
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
  const [dimsBySrc, setDimsBySrc] = useState<
    Record<string, { w: number; h: number }>
  >({})

  const activeSrc = n > 0 ? images[Math.min(Math.max(index, 0), n - 1)] : undefined
  const navIconBlack = shouldUseBlackArrows(activeSrc, dimsBySrc)

  const looped = n > 1
  const m = looped ? n + 2 : n
  const extended = looped
    ? [images[n - 1]!, ...images, images[0]!]
    : images

  useLayoutEffect(() => {
    if (n > 1) setNoTransition(false)
  }, [n])

  useLayoutEffect(() => {
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
    onIndexChange((prev) => (prev + 1) % n)
  }, [n, onIndexChange])

  const goPrev = useCallback(() => {
    if (n <= 1) return
    onIndexChange((prev) => (prev - 1 + n) % n)
  }, [n, onIndexChange])

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
        className="aspect-square min-h-0 w-full min-w-0 rounded-sm bg-[#ffffff]"
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
        <div className="relative aspect-square w-full min-w-0 overflow-hidden rounded-sm bg-[#ffffff]">
          <img
            src={images[0]!}
            alt=""
            className="h-full w-full object-contain"
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
        className="relative aspect-square w-full min-w-0 cursor-grab overflow-hidden rounded-sm bg-[#ffffff] active:cursor-grabbing"
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
              className="h-full min-w-0 shrink-0 bg-[#ffffff]"
              style={{ width: `${100 / m}%` }}
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-contain"
                loading={i === 1 ? 'eager' : 'lazy'}
                draggable={false}
                onLoad={recordNaturalSize(setDimsBySrc, src)}
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
        className={`absolute left-0 top-0 z-10 flex h-full w-10 sm:w-12 items-center justify-center bg-transparent transition-opacity hover:opacity-80 max-md:pointer-events-auto max-md:opacity-100 md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 ${
          navIconBlack
            ? 'text-black'
            : 'text-white [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.45))]'
        }`}
        aria-label="이전 이미지"
      >
        <span className="sr-only">이전</span>
        <svg
          className="pointer-events-none h-6 w-6"
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
        className={`absolute right-0 top-0 z-10 flex h-full w-10 sm:w-12 items-center justify-center bg-transparent transition-opacity hover:opacity-80 max-md:pointer-events-auto max-md:opacity-100 md:pointer-events-none md:opacity-0 md:group-hover:pointer-events-auto md:group-hover:opacity-100 md:group-focus-within:pointer-events-auto md:group-focus-within:opacity-100 focus-visible:pointer-events-auto focus-visible:opacity-100 ${
          navIconBlack
            ? 'text-black'
            : 'text-white [filter:drop-shadow(0_1px_2px_rgba(0,0,0,0.45))]'
        }`}
        aria-label="다음 이미지"
      >
        <span className="sr-only">다음</span>
        <svg
          className="pointer-events-none h-6 w-6"
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
