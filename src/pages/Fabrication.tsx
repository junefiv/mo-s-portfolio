import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  type TransitionEvent,
} from 'react'
import WorkImageCarousel from '../components/WorkImageCarousel'

/** picsum 목업: 인덱스마다 가로·정사각·세로 등 비율 혼합 */
const FAB_MOCK_DIMS: readonly [w: number, h: number][] = [
  [1180, 700],
  [820, 820],
  [660, 980],
  [1000, 520],
]

const fabPic = (entryId: string, i: number) => {
  const [w, h] = FAB_MOCK_DIMS[i % FAB_MOCK_DIMS.length]!
  return `https://picsum.photos/seed/fab-${entryId}-${i}/${w}/${h}`
}

type FabricationEntry = {
  id: string
  year: string
  title: string
  institution: string
  type: string
  /** 본문 문단 */
  paragraphs: string[]
  /** 캐러셀 이미지 URL */
  images: string[]
}

const ENTRIES: FabricationEntry[] = [
  {
    id: 'adf-2026',
    year: '2026',
    title: 'Advanced Digital Fabrication',
    institution: 'MIT Architecture',
    type: 'Workshop',
    paragraphs: [
      '디지털 제조 파이프라인 전체를 다루는 집중 워크숍입니다. 파일 준비, CNC·레이저, 로봇 암 연동까지 실습 중심으로 진행됩니다.',
      '산출물은 1:1 스케일 프로토타입과 제작 도면 패키지로 정리합니다.',
    ],
    images: [
      fabPic('adf-2026', 0),
      fabPic('adf-2026', 1),
      fabPic('adf-2026', 2),
    ],
  },
  {
    id: 'cds-2025',
    year: '2025',
    title: 'Computational Design Studio',
    institution: 'Harvard GSD',
    type: 'Studio',
    paragraphs: [
      '파라메트릭 모델과 구조·환기 시뮬레이션을 연결해 설계–제작 루프를 단축하는 스튜디오입니다.',
      '팀 단위로 스크립트 자산과 물리 프로토타입을 함께 제출합니다.',
    ],
    images: [fabPic('cds-2025', 0), fabPic('cds-2025', 1)],
  },
  {
    id: 'ms-2025',
    year: '2025',
    title: 'Material Systems',
    institution: 'Columbia GSAPP',
    type: 'Seminar',
    paragraphs: [
      '재료의 가역·비가역 변형과 조립 논리를 세미나 형식으로 정리합니다. 각 세션마다 소규모 벤치 테스트가 따라붙습니다.',
    ],
    images: [
      fabPic('ms-2025', 0),
      fabPic('ms-2025', 1),
      fabPic('ms-2025', 2),
      fabPic('ms-2025', 3),
    ],
  },
  {
    id: 'rc-2024',
    year: '2024',
    title: 'Robotic Construction',
    institution: 'ETH Zurich',
    type: 'Research',
    paragraphs: [
      '현장 로봇과 프리패브 모듈의 인터페이스를 연구합니다. 안전 구역, 센서 피드백, 작업 순서 최적화에 초점을 둡니다.',
      '파일럿 셀에서 수집한 사이클 타임 데이터로 워크플로를 재조정합니다.',
    ],
    images: [fabPic('rc-2024', 0), fabPic('rc-2024', 1)],
  },
]

export default function Fabrication() {
  const [openId, setOpenId] = useState<string | null>(null)
  /** 닫힘 애니메이션 중에도 패널 DOM 유지 */
  const [mountedId, setMountedId] = useState<string | null>(null)
  /** grid-rows 1fr ↔ 0fr — 열림/닫힘 모두 전환 */
  const [panelExpanded, setPanelExpanded] = useState(false)
  const [carouselIndex, setCarouselIndex] = useState<Record<string, number>>(
    {},
  )

  const openIdRef = useRef(openId)
  const panelExpandedRef = useRef(panelExpanded)
  openIdRef.current = openId
  panelExpandedRef.current = panelExpanded

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

  const onCarouselIndexChange = useCallback((id: string, index: number) => {
    setCarouselIndex((prev) => ({ ...prev, [id]: index }))
  }, [])

  return (
    <main className="min-w-0 px-6 pt-20">
      <div className="mx-auto w-full min-w-0 max-w-page py-20">
      

        <div className="flex min-w-0 flex-col gap-1">
          {ENTRIES.map((entry) => {
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
                            label={`${entry.title} — 이미지`}
                            index={imgIndex}
                            onIndexChange={(i) =>
                              onCarouselIndexChange(entry.id, i)
                            }
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
