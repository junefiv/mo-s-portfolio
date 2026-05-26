import {useCallback, useEffect, useRef, useState} from 'react'
import {createPortal} from 'react-dom'
import SiteSearchIntro from '@/components/SiteSearchIntro'
import WorkImageCarousel from '../components/WorkImageCarousel'
import {publicLoadErrorMessage} from '@/lib/publicLoadError'
import {fetchWorkProjects} from '@/lib/workFromSanity'
import {useMdUp} from '@/lib/useMdUp'

/** `@theme` lg와 동일: 우측 고정 레일은 lg 이상, 그 아래는 드로어 */
const LG_MIN_WIDTH = '(min-width: 64rem)'

function useLgUp() {
  const [lgUp, setLgUp] = useState(false)
  useEffect(() => {
    const mq = window.matchMedia(LG_MIN_WIDTH)
    const on = () => setLgUp(mq.matches)
    on()
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])
  return lgUp
}

/** 스크롤 멈춘 뒤 이만큼 유지 후 WORK 목록 페이드아웃 */
const RAIL_IDLE_HIDE_MS = 3200

/** WORK 우측 레일: 검은 글씨 + 흰 테두리(배경 색 자동 판별 없음) */
const RAIL_TEXT_STROKE =
  '[-webkit-text-stroke:0.45px_#fff] [paint-order:stroke_fill]'

function railButtonClassName(isActive: boolean) {
  const base = `w-auto max-w-full shrink-0 text-right font-semibold transition-all duration-500 ease-in-out text-neutral-950 ${RAIL_TEXT_STROKE}`
  return isActive
    ? `${base} shrink-0 text-sm md:text-base`
    : `${base} shrink-0 text-xs text-neutral-950/40 hover:text-neutral-950/85`
}

type WorkProject = {
  id: string
  no: number
  title: string
  subTitle1: string
  subTitle2: string
  subTitle3: string
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
  const mdUp = useMdUp()
  const [leftIndex, setLeftIndex] = useState(0)
  const [rightIndex, setRightIndex] = useState(0)
  const [bodyOpen, setBodyOpen] = useState(false)
  const bodyId = `work-body-${project.id}`

  return (
    <div ref={onBlockRef} className="min-w-0">
      <div className="mb-2 grid min-w-0 grid-cols-1 gap-2 landscape:max-md:grid-cols-2 md:grid-cols-2 sm:gap-3">
        <WorkImageCarousel
          images={project.imagesLeft}
          label={`${project.title} — left`}
          index={leftIndex}
          onIndexChange={setLeftIndex}
          lightboxEnabled={mdUp}
        />
        <WorkImageCarousel
          images={project.imagesRight}
          label={`${project.title} — right`}
          index={rightIndex}
          onIndexChange={setRightIndex}
          lightboxEnabled={mdUp}
        />
      </div>
      <div
        className={`grid min-w-0 grid-cols-1 gap-y-3 gap-x-2 sm:gap-x-3 md:grid-cols-2 ${
          bodyOpen ? 'md:items-start' : 'md:items-stretch'
        }`}
      >
        <div className="min-w-0">
          <h3 className="text-xl leading-tight">{project.title}</h3>
          {project.subTitle1 || project.subTitle2 || project.subTitle3 ? (
            <div className="mt-1 space-y-0">
              {project.subTitle1 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{project.subTitle1}</p>
              ) : null}
              {project.subTitle2 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{project.subTitle2}</p>
              ) : null}
              {project.subTitle3 ? (
                <p className="text-sm leading-relaxed text-muted-foreground">{project.subTitle3}</p>
              ) : null}
            </div>
          ) : null}
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
                aria-label={bodyOpen ? 'Close details' : 'Open details'}
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

  const lgUp = useLgUp()
  const [workDrawerOpen, setWorkDrawerOpen] = useState(false)
  const drawerHeaderDragRef = useRef<number | null>(null)

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
            subTitle1: r.subTitle1 ?? '',
            subTitle2: r.subTitle2 ?? '',
            subTitle3: r.subTitle3 ?? '',
            body: r.body ?? '',
            imagesLeft: left,
            imagesRight: right,
          }
        })
        .filter((p) => p.imagesLeft.length > 0 && p.imagesRight.length > 0)
      setProjects(mapped)
      setLoadErr(null)
    } catch (e) {
      setLoadErr(publicLoadErrorMessage(e))
    } finally {
      setLoadDone(true)
    }
  }, [])

  useEffect(() => {
    void loadProjects()
  }, [loadProjects])

  /** 다른 탭에서 아카이브 에디트 저장 후 돌아올 때 목록 갱신 */
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
      if (lgUp) scheduleRailHide()

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
  }, [scheduleRailHide, projects, lgUp])

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

  useEffect(() => {
    if (lgUp) setWorkDrawerOpen(false)
  }, [lgUp])

  useEffect(() => {
    if (lgUp || !workDrawerOpen) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [workDrawerOpen, lgUp])

  useEffect(() => {
    if (lgUp || !workDrawerOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setWorkDrawerOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [workDrawerOpen, lgUp])

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

  const renderProjectNavButtons = (afterPick?: () => void) =>
    projects.map((project, index) => (
      <button
        key={project.id}
        ref={(el) => {
          railButtonRefs.current[index] = el
        }}
        type="button"
        onClick={() => {
          scrollToProject(index)
          afterPick?.()
        }}
        className={railButtonClassName(activeProject === index)}
      >
        {project.title}
      </button>
    ))

  const workProjectRail =
    projects.length > 0 && lgUp ? (
      <div
        onPointerEnter={() => setRailHover(true)}
        onPointerLeave={() => setRailHover(false)}
        onPointerDown={() => {
          setRailPointerActive(true)
          scheduleRailHide()
        }}
        className={`fixed right-4 top-1/2 z-[200] w-max max-w-[calc(100vw-2rem)] -translate-y-1/2 transition-opacity duration-700 ease-in-out md:right-6 ${
          railVisible ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
      >
        <nav
          aria-label="WORK project list"
          onScroll={scheduleRailHide}
          className="flex min-h-0 max-h-[calc(100dvh-2rem-env(safe-area-inset-top,0px)-env(safe-area-inset-bottom,0px))] touch-pan-y flex-col items-end gap-1 overflow-y-auto overscroll-y-contain [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:gap-2"
        >
          {renderProjectNavButtons()}
        </nav>
      </div>
    ) : null

  const workMobileDrawer =
    projects.length > 0 && !lgUp ? (
      <>
        <div
          role="presentation"
          aria-hidden={!workDrawerOpen}
          className={`fixed inset-0 z-[198] bg-black/35 transition-opacity duration-300 ease-out ${
            workDrawerOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
          }`}
          onClick={() => setWorkDrawerOpen(false)}
        />
        <div
          id="work-project-drawer"
          role="dialog"
          aria-modal="true"
          aria-label="WORK 작품 목록"
          aria-hidden={!workDrawerOpen}
          className={`fixed inset-y-0 right-0 z-[200] flex w-max max-w-[calc(100vw-2rem)] shrink-0 flex-col border-l border-border/50 bg-background/95 pb-[env(safe-area-inset-bottom,0px)] pt-[env(safe-area-inset-top,0px)] pl-2 shadow-2xl backdrop-blur-md transition-transform duration-300 ease-out ${
            workDrawerOpen ? 'translate-x-0' : 'translate-x-full pointer-events-none'
          }`}
        >
          <div
            className="flex shrink-0 cursor-grab touch-pan-x items-center justify-between gap-2 border-b border-border/40 px-3 py-3 active:cursor-grabbing"
            onPointerDown={(e) => {
              drawerHeaderDragRef.current = e.clientX
              e.currentTarget.setPointerCapture(e.pointerId)
            }}
            onPointerMove={(e) => {
              const start = drawerHeaderDragRef.current
              if (start == null) return
              if (e.clientX - start > 64) {
                drawerHeaderDragRef.current = null
                try {
                  e.currentTarget.releasePointerCapture(e.pointerId)
                } catch {
                  /* already released */
                }
                setWorkDrawerOpen(false)
              }
            }}
            onPointerUp={(e) => {
              drawerHeaderDragRef.current = null
              try {
                e.currentTarget.releasePointerCapture(e.pointerId)
              } catch {
                /* noop */
              }
            }}
            onPointerCancel={(e) => {
              drawerHeaderDragRef.current = null
              try {
                e.currentTarget.releasePointerCapture(e.pointerId)
              } catch {
                /* noop */
              }
            }}
          >
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              WORK
            </span>
            <button
              type="button"
              className="inline-flex h-9 min-w-9 items-center justify-center rounded-md text-foreground/80 hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-foreground/25"
              aria-label="목록 닫기"
              onClick={() => setWorkDrawerOpen(false)}
            >
              <span className="text-xl leading-none" aria-hidden>
                ×
              </span>
            </button>
          </div>
          <nav
            aria-label="WORK project list"
            className="flex min-h-0 flex-1 touch-pan-y flex-col items-end gap-1 overflow-y-auto overscroll-y-contain py-3 pl-2 pr-[max(10px,env(safe-area-inset-right,0px))] [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden md:gap-2"
          >
            {renderProjectNavButtons(() => setWorkDrawerOpen(false))}
          </nav>
        </div>
        {!workDrawerOpen ? (
          <div className="pointer-events-none fixed right-0 top-1/2 z-[199] -translate-y-1/2 pl-1 pr-[max(6px,env(safe-area-inset-right,0px))]">
            <button
              type="button"
              aria-expanded={false}
              aria-controls="work-project-drawer"
              onClick={() => setWorkDrawerOpen(true)}
              className="pointer-events-auto inline-flex w-fit min-h-[4.5rem] shrink-0 items-center justify-center rounded-l-xl border border-black/15 border-r-0 bg-white/90 px-1 py-2 text-neutral-950 shadow-lg backdrop-blur-sm transition-transform active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-foreground/20"
              aria-label="작품 목록 열기"
            >
              <span className="text-xl font-semibold leading-none text-neutral-950/90" aria-hidden>
                ‹
              </span>
            </button>
          </div>
        ) : null}
      </>
    ) : null

  if (loadErr) {
    return (
      <div className="px-6 pt-page-below-nav">
        <SiteSearchIntro />
        <p className="mx-auto max-w-page text-sm text-destructive" role="alert" data-nosnippet>
          {loadErr}
        </p>
      </div>
    )
  }

  if (loadDone && projects.length === 0) {
    return (
      <div className="px-6 pt-page-below-nav">
        <SiteSearchIntro />
        <p className="mx-auto max-w-page text-sm text-muted-foreground">
          No WORK projects are available. Add one in `/admin` or Sanity Studio.
        </p>
      </div>
    )
  }

  if (!loadDone) {
    return (
      <div className="px-6 pt-page-below-nav">
        <SiteSearchIntro />
        <p className="mx-auto max-w-page text-sm text-muted-foreground" data-nosnippet>
          Loading…
        </p>
      </div>
    )
  }

  return (
    <>
      <SiteSearchIntro />
      <div className="px-6">
        <div className="mx-auto w-full min-w-0 max-w-page pt-page-below-nav pb-25">
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
      {workMobileDrawer ? createPortal(workMobileDrawer, document.body) : null}
    </>
  )
}
