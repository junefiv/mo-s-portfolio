import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from 'react'
import { Link, useLocation } from 'react-router'

/** 스크롤이 멈췄다고 판단하기 전 대기 (페이드와 겹치지 않게 넉넉히) */
const SCROLL_SETTLE_MS = 400
/** 2행 이상이면 → 햄버거 (첫 li 높이 대비) */
const WRAP_SLACK = 1.5
const ACCORDION_STAGGER_MS = 60

function isMultiRowMenu(ul: HTMLUListElement) {
  const li = ul.querySelector('li')
  if (!li) return false
  const lineH = li.getBoundingClientRect().height
  if (lineH < 1) return false
  const totalH = ul.getBoundingClientRect().height
  return totalH > lineH * WRAP_SLACK
}

export default function Navigation() {
  const location = useLocation()
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollEndRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const measureRef = useRef<HTMLUListElement>(null)
  /** 한 줄·줄비움(햄버거) 전환: 첫 렌더는 좁은 뷰 가정(모바일 퍼스트) */
  const [useHamburger, setUseHamburger] = useState(true)
  const [accOpen, setAccOpen] = useState(false)

  const links = [
    { path: '/', label: 'NEWS' },
    { path: '/academics', label: 'ACADEMICS' },
    { path: '/work', label: 'WORK' },
    { path: '/fabrication', label: 'FABRICATION' },
    { path: '/info', label: 'INFO' },
  ]

  const updateHamburger = useCallback(() => {
    const el = measureRef.current
    if (!el) return
    setUseHamburger(isMultiRowMenu(el))
  }, [])

  useLayoutEffect(() => {
    updateHamburger()
  }, [updateHamburger, location.pathname])

  useEffect(() => {
    const el = measureRef.current
    if (!el) return
    const ro = new ResizeObserver(() => {
      updateHamburger()
    })
    ro.observe(el)
    return () => {
      ro.disconnect()
    }
  }, [updateHamburger, location.pathname])

  useEffect(() => {
    if (!useHamburger) {
      setAccOpen(false)
    }
  }, [useHamburger])

  useEffect(() => {
    setAccOpen(false)
  }, [location.pathname])

  useEffect(() => {
    const onScroll = () => {
      setIsScrolling(true)
      if (scrollEndRef.current) {
        clearTimeout(scrollEndRef.current)
      }
      scrollEndRef.current = setTimeout(() => {
        setIsScrolling(false)
        scrollEndRef.current = null
      }, SCROLL_SETTLE_MS)
    }
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => {
      window.removeEventListener('scroll', onScroll)
      if (scrollEndRef.current) {
        clearTimeout(scrollEndRef.current)
      }
    }
  }, [])

  const isActive = (path: string) =>
    path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(path)

  return (
    <nav
      className="fixed top-0 left-0 right-0 z-50"
      style={{ paddingTop: 'env(safe-area-inset-top, 0px)' }}
    >
      <div
        className={`mx-auto w-full min-w-0 max-w-page border-b px-6 py-3 transition-all duration-1000 ease-in-out ${
          isScrolling
            ? 'border-transparent bg-transparent'
            : 'border-black/20 bg-white/80 backdrop-blur-md'
        }`}
      >
        <div
          className={`transition-opacity duration-1000 ease-in-out ${
            isScrolling ? 'pointer-events-none opacity-0' : 'opacity-100'
          }`}
        >
          <div className="mb-3">
            <Link
              to="/"
              className="inline-block text-sm font-medium tracking-[0.2em] text-foreground transition-opacity hover:opacity-70"
            >
              MORTFOLIO
            </Link>
          </div>

          <div className="relative min-w-0">
            {/*
              줄바꿈 여부 전용(보이지 않음). 2행 이상이면 useHamburger = true
            */}
            <ul
              ref={measureRef}
              className="invisible pointer-events-none absolute -z-10 flex w-full min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:gap-x-6"
              aria-hidden
            >
              {links.map((link) => (
                <li key={`m-${link.path}`}>
                  <span className="text-sm tracking-wide">{link.label}</span>
                </li>
              ))}
            </ul>

            {useHamburger ? (
              <div className="min-w-0">
                <div className="flex justify-end">
                  <button
                    type="button"
                    onClick={() => setAccOpen((o) => !o)}
                    aria-expanded={accOpen}
                    aria-controls="nav-accordion"
                    className="inline-flex p-2 text-foreground -outline-offset-2 transition-opacity hover:opacity-70"
                  >
                    <span className="sr-only">
                      {accOpen ? '메뉴 닫기' : '메뉴 열기'}
                    </span>
                    <span
                      className="flex h-5 w-6 flex-col items-center justify-center gap-1.5"
                      aria-hidden
                    >
                      <span
                        className={`h-0.5 w-5 rounded-sm bg-foreground transition-transform duration-500 ease-in-out ${
                          accOpen ? 'translate-y-2 rotate-45' : ''
                        }`}
                      />
                      <span
                        className={`h-0.5 w-5 rounded-sm bg-foreground transition-opacity duration-500 ease-in-out ${
                          accOpen ? 'opacity-0' : ''
                        }`}
                      />
                      <span
                        className={`h-0.5 w-5 rounded-sm bg-foreground transition-transform duration-500 ease-in-out ${
                          accOpen ? '-translate-y-2 -rotate-45' : ''
                        }`}
                      />
                    </span>
                  </button>
                </div>

                <div
                  id="nav-accordion"
                  className="grid w-full min-w-0 transition-[grid-template-rows] duration-500 ease-in-out"
                  style={{ gridTemplateRows: accOpen ? '1fr' : '0fr' }}
                >
                  <div className="min-h-0 overflow-hidden">
                    <ul className="border-t border-black/20">
                      {links.map((link, i) => {
                        const active = isActive(link.path)
                        return (
                          <li
                            key={link.path}
                            className="border-b border-border/30 last:border-b-0"
                          >
                            <Link
                              to={link.path}
                              onClick={() => setAccOpen(false)}
                              className={`block w-full min-w-0 py-3 text-sm tracking-wide transition-all duration-500 ease-out ${
                                accOpen
                                  ? 'translate-y-0'
                                  : 'pointer-events-none -translate-y-1'
                              } ${
                                accOpen
                                  ? active
                                    ? 'opacity-100'
                                    : 'opacity-40'
                                  : 'opacity-0'
                              }`}
                              style={{
                                transitionDelay: accOpen
                                  ? `${i * ACCORDION_STAGGER_MS}ms`
                                  : '0ms',
                              }}
                            >
                              {link.label}
                            </Link>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                </div>
              </div>
            ) : (
              <ul className="relative z-10 flex w-full min-w-0 flex-wrap items-center justify-between gap-x-4 gap-y-2 sm:gap-x-6">
                {links.map((link) => {
                  const active = isActive(link.path)
                  return (
                    <li key={link.path}>
                      <Link
                        to={link.path}
                        className={`text-sm tracking-wide transition-opacity hover:opacity-60 ${
                          active ? 'opacity-100' : 'opacity-40'
                        }`}
                      >
                        {link.label}
                      </Link>
                    </li>
                  )
                })}
              </ul>
            )}
          </div>
        </div>
      </div>
    </nav>
  )
}
