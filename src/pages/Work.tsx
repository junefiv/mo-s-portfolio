import {useCallback, useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import WorkImageCarousel from '../components/WorkImageCarousel'
import {fetchWorkProjects} from '../lib/workFromSanity'

const AUTO_INTERVAL_MS = 10_000

/** 스크롤 멈춘 뒤 이만큼 유지 후 WORK 목록 페이드아웃 */
const RAIL_IDLE_HIDE_MS = 3200

/** WORK 우측 레일: 검은 글씨 + 흰 테두리(배경 색 자동 판별 없음) */
const RAIL_TEXT_STROKE =
  '[-webkit-text-stroke:0.45px_#fff] [paint-order:stroke_fill]'

function railButtonClassName(isActive: boolean) {
  const base = `w-full min-w-0 text-right break-words font-semibold transition-all duration-500 ease-in-out text-neutral-950 ${RAIL_TEXT_STROKE}`
  return isActive
    ? `${base} shrink-0 text-sm md:text-base`
    : `${base} shrink-0 text-xs text-neutral-950/40 hover:text-neutral-950/85`
}

type WorkProject = {
  id: string
  no: number
  title: string
  subTitle: string
  body: string
  imagesLeft: string[]
  imagesRight: string[]
}

function WorkProjectSet({
  project,
  onBlockRef,
}: {
  project: WorkProject
  onBlockRef: (el: HTMLDivElement | null) => void
}) {
  const [leftIndex, setLeftIndex] = useState(0)
  const [rightIndex, setRightIndex] = useState(0)
  const [autoplay, setAutoplay] = useState(true)
  const [bodyOpen, setBodyOpen] = useState(false)
  const bodyId = `work-body-${project.id}`

  const leftN = project.imagesLeft.length
  const rightN = project.imagesRight.length
  const canAutoplay = leftN > 1 || rightN > 1

  useEffect(() => {
    if (!autoplay || !canAutoplay) return
    const t = window.setInterval(() => {
      if (leftN > 1) setLeftIndex((i) => (i + 1) % leftN)
      if (rightN > 1) setRightIndex((i) => (i + 1) % rightN)
    }, AUTO_INTERVAL_MS)
    return () => clearInterval(t)
  }, [autoplay, canAutoplay, leftN, rightN, leftIndex, rightIndex])

  return (
    <div ref={onBlockRef} className="min-w-0">
      <div className="mb-2 grid min-w-0 grid-cols-2 gap-2 sm:gap-3">
        <WorkImageCarousel
          images={project.imagesLeft}
          label={`${project.title} — left`}
          index={leftIndex}
          onIndexChange={setLeftIndex}
        />
        <WorkImageCarousel
          images={project.imagesRight}
          label={`${project.title} — right`}
          index={rightIndex}
          onIndexChange={setRightIndex}
        />
      </div>
      <div
        className={`grid min-w-0 grid-cols-1 gap-y-3 gap-x-2 sm:gap-x-3 md:grid-cols-2 ${
          bodyOpen ? 'md:items-start' : 'md:items-stretch'
        }`}
      >
        <div className="flex min-w-0 items-start gap-3 sm:gap-4">
          {canAutoplay && (
            <button
              type="button"
              onClick={() => setAutoplay((p) => !p)}
              className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-all hover:bg-foreground/5 hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
              aria-pressed={autoplay}
              aria-label={autoplay ? '자동 재생 멈춤' : '자동 재생 시작'}
            >
              {autoplay ? (
                <span className="flex items-center justify-center gap-0.5" aria-hidden>
                  <span className="h-3.5 w-1 rounded-sm bg-foreground" />
                  <span className="h-3.5 w-1 rounded-sm bg-foreground" />
                </span>
              ) : (
                <svg
                  className="ml-0.5 h-5 w-5"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                  aria-hidden
                >
                  <path d="M8 5.14v14l11-7-11-7z" />
                </svg>
              )}
            </button>
          )}
          <div className="min-w-0 flex-1">
            <h3 className="text-xl leading-tight">{project.title}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{project.subTitle}</p>
          </div>
        </div>

        <div
          className={`min-w-0 flex flex-col ${!bodyOpen ? 'md:h-full md:min-h-0' : ''}`}
        >
          <div
            className={`flex min-w-0 flex-col border-t border-border/60 pt-3 md:border-t-0 md:border-l md:pt-0 md:pl-4 ${
              !bodyOpen ? 'md:min-h-0 md:flex-1' : ''
            }`}
          >
            <div
              className={`flex w-full shrink-0 items-center justify-center max-md:py-3 ${
                !bodyOpen ? 'md:min-h-0 md:flex-1' : 'py-2 md:py-2'
              }`}
            >
              <button
                type="button"
                id={`${bodyId}-toggle`}
                aria-expanded={bodyOpen}
                aria-controls={bodyId}
                onClick={() => setBodyOpen((o) => !o)}
                className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-foreground/65 transition-colors duration-200 hover:bg-foreground/[0.06] hover:text-foreground active:scale-[0.98] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/20"
                aria-label={bodyOpen ? '상세 닫기' : '상세 열기'}
              >
                <span
                  className="text-3xl font-large leading-none tabular-nums"
                  aria-hidden
                >
                  {bodyOpen ? '−' : '+'}
                </span>
              </button>
            </div>
            <div
              className={`grid min-w-0 transition-[grid-template-rows] duration-500 ease-out ${
                bodyOpen ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]'
              }`}
            >
              <div className="min-h-0 overflow-hidden">
                <div
                  id={bodyId}
                  role="region"
                  aria-labelledby={`${bodyId}-toggle`}
                  className="text-sm leading-relaxed text-foreground/90 whitespace-pre-line"
                >
                  {project.body}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function Work() {
  const [projects, setProjects] = useState<WorkProject[]>([])
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [loadDone, setLoadDone] = useState(false)

  const [activeProject, setActiveProject] = useState(0)
  const [isScrolling, setIsScrolling] = useState(false)
  const [railHover, setRailHover] = useState(false)
  /** 터치/드래그 중(모바일): hover가 없을 때 사라짐 방지 */
  const [railPointerActive, setRailPointerActive] = useState(false)
  const projectRefs = useRef<(HTMLDivElement | null)[]>([])
  const railButtonRefs = useRef<(HTMLButtonElement | null)[]>([])
  const scrollTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const scheduleRailHide = useCallback(() => {
    setIsScrolling(true)
    if (scrollTimeoutRef.current) {
      clearTimeout(scrollTimeoutRef.current)
    }
    scrollTimeoutRef.current = setTimeout(() => {
      setIsScrolling(false)
      scrollTimeoutRef.current = null
    }, RAIL_IDLE_HIDE_MS)
  }, [])

  const loadProjects = useCallback(async () => {
    try {
      const rows = await fetchWorkProjects()
      const mapped: WorkProject[] = rows
        .filter((r) => r._id && r.title)
        .map((r) => {
          const left = (r.imagesLeft ?? [])
            .map((x) => x?.url)
            .filter((u): u is string => !!u)
          const right = (r.imagesRight ?? [])
            .map((x) => x?.url)
            .filter((u): u is string => !!u)
          return {
            id: r._id,
            no: r.projectNo ?? 0,
            title: r.title ?? '',
            subTitle: r.subTitle ?? '',
            body: r.body ?? '',
            imagesLeft: left,
            imagesRight: right,
          }
        })
        .filter((p) => p.imagesLeft.length > 0 && p.imagesRight.length > 0)
      setProjects(mapped)
      setLoadErr(null)
    } catch (e) {
      setLoadErr(e instanceof Error ? e.message : String(e))
    } finally {
      setLoadDone(true)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  /** 다른 탭에서 아카이브 순서 저장 후 돌아올 때 목록 갱신 */
  useEffect(() => {
    const onVis = () => {
      if (document.visibilityState === 'visible') void loadProjects()
    }
    document.addEventListener('visibilitychange', onVis)
    return () => document.removeEventListener('visibilitychange', onVis)
  }, [loadProjects])

  useEffect(() => {
    setActiveProject((i) => (projects.length === 0 ? 0 : Math.min(i, projects.length - 1)))
  }, [projects.length])

  useEffect(() => {
    const handleWindowScroll = () => {
      scheduleRailHide()

      const scrollPosition = window.scrollY + window.innerHeight / 2

      for (let i = projectRefs.current.length - 1; i >= 0; i--) {
        const element = projectRefs.current[i]
        if (element && element.offsetTop <= scrollPosition) {
          setActiveProject(i)
          break
        }
      }
    }

    window.addEventListener('scroll', handleWindowScroll, {passive: true})
    handleWindowScroll()

    return () => {
      window.removeEventListener('scroll', handleWindowScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [scheduleRailHide, projects])

  /** 터치 끝은 레일 밖에서 일어날 수 있어 window에서 해제 */
  useEffect(() => {
    if (!railPointerActive) return
    const end = () => {
      setRailPointerActive(false)
    }
    window.addEventListener('pointerup', end, {capture: true})
    window.addEventListener('pointercancel', end, {capture: true})
    return () => {
      window.removeEventListener('pointerup', end, {capture: true})
      window.removeEventListener('pointercancel', end, {capture: true})
    }
  }, [railPointerActive])

  /** 스크롤에 따라 active가 바뀌면, 고정 레일 안에서도 해당 버튼이 잘리지 않게 맞춤 */
  useEffect(() => {
    const el = railButtonRefs.current[activeProject]
    el?.scrollIntoView({block: 'nearest', inline: 'nearest'})
  }, [activeProject])

  const scrollToProject = (index: number) => {
    projectRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  const railVisible = isScrolling || railHover || railPointerActive

  const workProjectRail =
    projects.length > 0 ? (
      <div
        onPointerEnter={() => setRailHover(true)}
        onPointerLeave={() => setRailHover(false)}
        onPointerDown={() => {
          setRailPointerActive(true)
          scheduleRailHide()
        }}
        className={`fixed right-4 top-1/2 z-[200] w-auto max-w-[min(12rem,45vw)] -translate-y-1/2 transition-opacity duration-700 ease-in-out md:right-6 md:max-w-xs ${
          railVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <nav
          aria-label="WORK 프로젝트 목록"
          onScroll={scheduleRailHide}
          className="flex min-h-0 max-h-[calc(100dvh-2rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] touch-pan-y flex-col items-end gap-1 overflow-y-auto overscroll-y-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:gap-2"
        >
          {projects.map((project, index) => (
            <button
              key={project.id}
              ref={(el) => {
                railButtonRefs.current[index] = el
              }}
              type="button"
              onClick={() => scrollToProject(index)}
              className={railButtonClassName(activeProject === index)}
            >
              {project.title}
            </button>
          ))}
        </nav>
      </div>
    ) : null

  if (loadErr) {
    return (
      <div className="px-6 pt-20">
        <p className="mx-auto max-w-page text-sm text-destructive" role="alert">
          {loadErr}
        </p>
      </div>
    )
  }

  if (loadDone && projects.length === 0) {
    return (
      <div className="px-6 pt-20">
        <p className="mx-auto max-w-page text-sm text-muted-foreground">
          등록된 WORK 프로젝트가 없습니다. /admin 또는 Sanity Studio에서 추가하세요.
        </p>
      </div>
    )
  }

  if (!loadDone) {
    return (
      <div className="px-6 pt-20">
        <p className="mx-auto max-w-page text-sm text-muted-foreground">불러오는 중…</p>
      </div>
    )
  }

  return (
    <>
      <div className="px-6 pt-20">
        <div className="mx-auto w-full min-w-0 max-w-page py-25">
          <div className="grid grid-cols-1 gap-12">
            {projects.map((project, index) => (
              <WorkProjectSet
                key={project.id}
                project={project}
                onBlockRef={(el) => {
                  projectRefs.current[index] = el
                }}
              />
            ))}
          </div>
        </div>
      </div>
      {workProjectRail ? createPortal(workProjectRail, document.body) : null}
    </>
  )
}
