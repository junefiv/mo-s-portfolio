import {useCallback, useEffect, useId, useState} from 'react'
import {createPortal} from 'react-dom'

export type ImageLightboxProps = {
  open: boolean
  onClose: () => void
  /** 표시할 이미지 URL 목록 */
  images: string[]
  /** 열릴 때의 인덱스(부모 `index`와 맞출 것) */
  startIndex: number
  /** 라이트박스에서 이전/다음으로 바꿀 때 부모 캐러셀 등과 동기화(선택) */
  onNavigate?: (index: number) => void
  'aria-label'?: string
}

const TAP_MAX_MOVE_PX = 10

/**
 * 풀스크린 딤 + 중앙 정사각 흰 액자, 이미지는 object-contain.
 * - 밝은 반투명 오버레이(이미지 바깥) 클릭 → 닫기
 * - 이전/다음: 화면 좌·우 끝(단일 이미지일 때는 숨김)
 * - Esc → 닫기, 좌우 화살표 → 이전/다음
 */
export function ImageLightbox({
  open,
  onClose,
  images,
  startIndex,
  onNavigate,
  'aria-label': ariaLabel = 'Image viewer',
}: ImageLightboxProps) {
  const titleId = useId()
  const [idx, setIdx] = useState(0)
  const n = images.length

  useEffect(() => {
    if (open) {
      const safe =
        n === 0
          ? 0
          : Math.min(Math.max(0, startIndex), n - 1)
      setIdx(safe)
    }
  }, [open, n, startIndex])

  const go = useCallback(
    (next: number) => {
      if (n === 0) return
      const s = (next + n) % n
      setIdx(s)
      onNavigate?.(s)
    },
    [n, onNavigate],
  )

  const goPrev = useCallback(() => {
    if (n <= 1) return
    go(idx - 1)
  }, [go, idx, n])

  const goNext = useCallback(() => {
    if (n <= 1) return
    go(idx + 1)
  }, [go, idx, n])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        onClose()
        return
      }
      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        goPrev()
        return
      }
      if (e.key === 'ArrowRight') {
        e.preventDefault()
        goNext()
      }
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [open, onClose, goPrev, goNext])

  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [open])

  if (!open || n === 0) return null

  const src = images[idx] ?? images[0]
  if (!src) return null

  const showNav = n > 1

  const content = (
    <div
      className="fixed inset-0 z-[500] min-h-0 w-full"
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
    >
      <p id={titleId} className="sr-only">
        {ariaLabel}
      </p>
      {/* 딤(뷰포트 전체): 이 영역 클릭 시에만 닫힘. 이미지+내부 네비는 z 위에서 처리 */}
      <button
        type="button"
        onClick={onClose}
        className="absolute inset-0 z-0 min-h-0 w-full border-0 bg-white/85 p-0"
        aria-label="닫기"
      />
      {showNav ? (
        <>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              goPrev()
            }}
            className="pointer-events-auto fixed left-0 top-0 z-20 flex h-full w-14 min-w-14 xs:w-16 sm:w-[4.5rem] md:w-20 items-center justify-center border-0 bg-transparent p-0 text-foreground/85 [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.95))_drop-shadow(0_0_2px_rgba(0,0,0,0.2))] transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25"
            aria-label="이전 이미지"
          >
            <svg
              className="pointer-events-none h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 md:h-14 md:w-14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
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
            className="pointer-events-auto fixed right-0 top-0 z-20 flex h-full w-14 min-w-14 xs:w-16 sm:w-[4.5rem] md:w-20 items-center justify-center border-0 bg-transparent p-0 text-foreground/85 [filter:drop-shadow(0_1px_0_rgba(255,255,255,0.95))_drop-shadow(0_0_2px_rgba(0,0,0,0.2))] transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/25"
            aria-label="다음 이미지"
          >
            <svg
              className="pointer-events-none h-10 w-10 xs:h-11 xs:w-11 sm:h-12 sm:w-12 md:h-14 md:w-14"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.25"
              aria-hidden
            >
              <path
                d="M9 6l6 6-6 6"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </button>
        </>
      ) : null}
      <div className="pointer-events-none absolute inset-0 z-10 flex min-h-0 w-full min-w-0 items-center justify-center p-3 sm:p-4 md:p-6">
        {/* 정사각형 — 썸네일 대비 ~1.5배 정도만 커 보이도록 한 변 상한을 낮춤. object-contain 여백은 흰 배경 */}
        <div className="pointer-events-auto relative aspect-square w-[min(68dvw,calc(85dvh-3rem),40rem)] max-w-full min-h-0 min-w-0 shrink-0 overflow-hidden bg-white">
          <div className="relative flex h-full w-full min-h-0 min-w-0 items-center justify-center">
            <img
              src={src}
              alt=""
              className="h-full w-full min-h-0 min-w-0 select-none object-contain"
              draggable={false}
            />
          </div>
        </div>
      </div>
    </div>
  )

  return createPortal(content, document.body)
}

/**
 * n>1 캐러셀에서 "탭"인지 "스와이프"인지 구분(스와이프면 라이트박스를 열지 않음)
 */
export function isTapForLightbox(
  start: {x: number; y: number} | null,
  endX: number,
  endY: number,
): boolean {
  if (!start) return false
  const dx = endX - start.x
  const dy = endY - start.y
  return (
    Math.abs(dx) < TAP_MAX_MOVE_PX && Math.abs(dy) < TAP_MAX_MOVE_PX
  )
}
