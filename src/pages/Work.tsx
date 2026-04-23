import { useCallback, useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import WorkImageCarousel from '../components/WorkImageCarousel'

/** picsum 목업: 슬롯마다 가로·정사각·세로 비율 혼합 (캐러셀 object-contain 테스트용) */
const WORK_MOCK_DIMS: readonly [w: number, h: number][] = [
  [1200, 720],
  [800, 800],
  [640, 960],
]

const pics = (projectNo: number, col: 'L' | 'R', slot: number) => {
  const dimIdx = (slot + (col === 'R' ? 1 : 0)) % WORK_MOCK_DIMS.length
  const [w, h] = WORK_MOCK_DIMS[dimIdx]!
  return `https://picsum.photos/seed/w${projectNo}-${col}${slot}/${w}/${h}`
}

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
  const bodyId = `work-body-${project.no}`

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
                className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-foreground/70 transition-all hover:bg-foreground/5 hover:text-foreground active:scale-[0.97] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40"
                aria-label={bodyOpen ? '상세 닫기' : '상세 열기'}
              >
                <span
                  className="text-lg font-light leading-none tabular-nums transition-opacity duration-200"
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

  const projectSeeds: Omit<WorkProject, 'imagesLeft' | 'imagesRight'>[] = [
    {
      no: 50,
      title: 'Bio-Responsive Skin',
      subTitle: '2026 · Seoul, KR — 연구 · 프로토타입',
      body: '생체 모방 센서와 mycelium 기반 패널로 구성된 외피 시스템. 습도·온도 변화에 따라 개폐와 색상 전환이 일어나며, 실내 미세기후를 자동 조절합니다. 도시 열섬 완화와 탄소 포집 기능을 동시에 테스트 중입니다.',
    },
    {
      no: 49,
      title: 'Vertical Urban Farm Tower',
      subTitle: '2026 · Singapore, SG — 고층 · 농업',
      body: '수직 농업 모듈과 주거를 통합한 타워. hydroponic 시스템과 AI 기반 재배 관리를 통해 식량 자급률을 높이고, 폐열·폐수를 순환시켜 에너지 효율을 극대화했습니다.',
    },
    {
      no: 48,
      title: 'Robotic Clay Pavilion',
      subTitle: '2025 · Zurich, CH — 설치 · 디지털 제작',
      body: '로봇 암으로 3D 프린팅된 점토 패널을 현장 조립. 전통 도기 기법과 파라메트릭 설계를 결합해 자중 구조를 실현하고, 자연 환기와 열 질량을 최적화했습니다.',
    },
    {
      no: 47,
      title: 'AI-Driven Community Hub',
      subTitle: '2025 · Boston, MA — 커뮤니티 · 연구',
      body: '주민 참여 데이터를 실시간으로 반영하는 적응형 공간. generative AI가 동선·프로그램을 제안하고, 계절별 워크숍 공간이 자동 재구성됩니다.',
    },
    {
      no: 46,
      title: 'Floating Modular Housing',
      subTitle: '2025 · Amsterdam, NL — 주거 · 기후 적응',
      body: '기후 변화 대응 수상 주택 모듈. 볼트 연결식 프리패브 시스템으로 홍수 시 부상하고, 태양광·조력 에너지를 통합해 자립형 생활을 지원합니다.',
    },
    {
      no: 45,
      title: 'Kinetic Shading Canopy',
      subTitle: '2024 · London, UK — 공공 공간 · 설치',
      body: '바람과 일사량에 따라 움직이는 키네틱 캐노피. ETFE 막과 센서 네트워크로 그늘·빛·환기를 동적으로 제어하며, 광장 활성화를 위한 퍼포먼스 요소로 작동합니다.',
    },
    {
      no: 44,
      title: 'Regenerative Timber High-Rise',
      subTitle: '2024 · Vancouver, CA — 고층 · 지속가능',
      body: '모듈러 목재 구조로 재구성 가능한 타워. 탄소 저장과 함께 층간 재배치가 가능해 건물 수명을 연장하고, 순환 경제 원칙을 적용했습니다.',
    },
    {
      no: 43,
      title: 'Mycelium Brick Lab',
      subTitle: '2024 · Berlin, DE — 재료 연구 · 문화시설',
      body: '균사체 기반 벽돌을 실험·전시하는 연구소. 성장 과정과 구조 강도를 모니터링하며, 저탄소 대안 재료로의 스케일업을 준비 중입니다.',
    },
    {
      no: 42,
      title: 'Parametric Bamboo Pavilion',
      subTitle: '2024 · Tokyo, JP — 설치 · 공공 프로그램',
      body: '대나무를 파라메트릭하게 가공해 모듈화. 현장 조립 시간을 최소화하고, 전통 공예와 디지털 제작을 연결하는 하이브리드 구조를 구현했습니다.',
    },
    {
      no: 41,
      title: 'Adaptive Waterfront Lab',
      subTitle: '2023 · Barcelona, ES — 연구 인프라',
      body: '해수면 상승에 대응하는 적응형 워터프론트 시설. 센서 기반 부유 플랫폼과 데이터 수집 공간을 결합해 도시-바다 경계의 새로운 관계를 탐구합니다.',
    },
    {
      no: 40,
      title: 'Zero-Waste Fabrication Hub',
      subTitle: '2023 · New York, NY — 제작 거점',
      body: '폐기물을 입력으로 재활용하는 디지털 제작소. 로봇·CNC·3D 프린터가 폐자재를 실시간으로 처리하며, 순환형 제작 프로세스를 구축했습니다.',
    },
    {
      no: 39,
      title: 'Hybrid Earth-Fiber Facade',
      subTitle: '2023 · Mexico City, MX — 프로토타입 · 지속가능',
      body: '현지 흙과 섬유를 3D 프린팅한 자가 차양 외피. 열 성능과 구조를 동시에 최적화하며, 저비용·저탄소 지역 건축 솔루션을 제안합니다.',
    },
    {
      no: 38,
      title: 'Generative Urban Block',
      subTitle: '2023 · Seoul, KR — 도시 계획 · 주거',
      body: 'generative algorithm으로 블록 레이아웃을 생성. 각 세대별 맞춤형 평면과 공유 공간을 균형 있게 배치해 고밀도 도시의 새로운 모델을 테스트합니다.',
    },
    {
      no: 37,
      title: 'Living Wall Research Center',
      subTitle: '2022 · Zurich, CH — 문화시설 · 연구',
      body: '수직 녹지와 센서 네트워크를 통합한 연구센터. 생태 데이터와 건축 성능을 실시간 연동하며, 바이오필릭 디자인의 정량적 효과를 측정합니다.',
    },
    {
      no: 36,
      title: 'Modular Capsule Retrofit',
      subTitle: '2022 · Tokyo, JP — 주거 · 리노베이션',
      body: '기존 캡슐 타워를 모듈러 유닛으로 업그레이드. 에너지 효율과 공간 유연성을 높이며, 1970년대 메타볼리즘 건축의 현대적 재해석을 시도했습니다.',
    },
    {
      no: 35,
      title: 'Climate-Responsive Pavilion',
      subTitle: '2026 · Sydney, AU — 설치 · 공공',
      body: '기후 조건에 따라 형태가 변하는 파빌리온. shape-memory alloy와 parametric 패턴으로 자연 환기와 그늘을 최적화합니다.',
    },
    {
      no: 34,
      title: 'Circular Economy Housing',
      subTitle: '2025 · Copenhagen, DK — 주거',
      body: '완전 분리·재사용 가능한 모듈 주택. 건설 폐기물을 최소화하고, 수명 종료 시 재료 회수율 95% 이상을 목표로 설계했습니다.',
    },
    {
      no: 33,
      title: 'Sensorial Material Library',
      subTitle: '2025 · London, UK — 재료 연구',
      body: '다양한 스마트 재료를 체험하고 테스트하는 라이브러리. 촉각·시각·열적 특성을 데이터화해 건축가와 디자이너의 선택을 지원합니다.',
    },
    {
      no: 32,
      title: 'Robotic Assembly Tower',
      subTitle: '2024 · Dubai, AE — 고층 · 제작',
      body: '로봇 온사이트 조립 시스템으로 건설된 타워. 프리패브와 현장 제작의 하이브리드를 통해 속도와 정밀도를 동시에 달성했습니다.',
    },
    {
      no: 31,
      title: 'Biophilic Office Retrofit',
      subTitle: '2024 · Berlin, DE — 사무 · 지속가능',
      body: '기존 사무 공간에 생물 친화적 요소를 추가한 리트로핏. 자연광·식물·물 요소를 최적 배치해 생산성과 웰빙을 높입니다.',
    },
    {
      no: 30,
      title: 'Parametric Soundscape Wall',
      subTitle: '2023 · Barcelona, ES — 공공 · 음향',
      body: '음향 성능과 미학을 파라메트릭하게 최적화한 벽체. 도시 소음을 줄이면서도 시각적 리듬을 창출합니다.',
    },
    {
      no: 29,
      title: '3D-Printed Earthen School',
      subTitle: '2023 · Marrakech, MA — 교육 · 지역',
      body: '현지 흙을 활용한 3D 프린팅 학교. 저비용·저에너지 건축으로 지역 커뮤니티 교육 환경을 개선합니다.',
    },
    {
      no: 28,
      title: 'Adaptive Reuse Warehouse',
      subTitle: '2022 · New York, NY — 문화시설',
      body: '창고를 다목적 문화 공간으로 전환. 구조 보강과 새로운 동선을 최소 개입으로 설계해 역사성과 현대성을 조화시켰습니다.',
    },
    {
      no: 27,
      title: 'AI-Optimized Facade System',
      subTitle: '2026 · Tokyo, JP — 연구 · 외피',
      body: '머신러닝으로 실시간 최적화되는 외피 시스템. 에너지 소비와 사용자 편의를 동시에 고려한 다중 목표 최적화입니다.',
    },
    {
      no: 26,
      title: 'Floating Research Platform',
      subTitle: '2025 · Venice, IT — 연구 인프라',
      body: '수상 도시의 미래를 위한 부유 연구 플랫폼. 모듈러 확장성과 해양 생태 모니터링 기능을 통합했습니다.',
    },
    {
      no: 25,
      title: 'Modular Disaster Relief Unit',
      subTitle: '2025 · Manila, PH — 주거 · 재난 대응',
      body: '빠른 배치가 가능한 모듈러 재난 구호 주택. 현지 재료와 결합해 문화적 적합성을 높였습니다.',
    },
    {
      no: 24,
      title: 'Kinetic Cultural Center',
      subTitle: '2024 · Paris, FR — 문화시설',
      body: '움직이는 요소로 프로그램을 유연하게 전환하는 문화센터. 방문자 참여형 전시와 공연 공간을 동적으로 연결합니다.',
    },
    {
      no: 23,
      title: 'Carbon-Negative Pavilion',
      subTitle: '2024 · Zurich, CH — 설치',
      body: '탄소 음성 재료와 설계로 구현된 파빌리온. 생태 데이터 수집과 교육 기능을 겸비합니다.',
    },
    {
      no: 22,
      title: 'Generative Landscape Bridge',
      subTitle: '2023 · Singapore, SG — 인프라 · 공공',
      body: 'generative design으로 형태를 최적화한 보행자 다리. 녹지와 휴식 공간을 통합해 도시 경관을 강화합니다.',
    },
    {
      no: 21,
      title: 'Smart Grid Housing Cluster',
      subTitle: '2023 · Boston, MA — 주거',
      body: '에너지 그리드와 연동된 주거 클러스터. 공유 에너지 시스템과 스마트 홈 기술을 통해 커뮤니티 단위 효율을 극대화했습니다.',
    },
    {
      no: 20,
      title: 'Bio-Fabricated Interior',
      subTitle: '2022 · London, UK — 인테리어 · 연구',
      body: '균사체와 바이오 플라스틱으로 제작된 인테리어 요소. 가구부터 벽 마감까지 순환형 재료를 적용했습니다.',
    },
    {
      no: 19,
      title: 'Urban Heat Island Mitigation Lab',
      subTitle: '2026 · Seoul, KR — 연구',
      body: '도시 열섬 완화 전략을 테스트하는 실험실. 적응형 외피와 그린 인프라의 복합 효과를 정량화합니다.',
    },
    {
      no: 18,
      title: 'Parametric Timber Grid Shell',
      subTitle: '2025 · Barcelona, ES — 구조 · 설치',
      body: '파라메트릭 목재 그리드 쉘 구조. 가벼움과 강성을 동시에 달성하며, 대경간 공간을 효율적으로 커버합니다.',
    },
    {
      no: 17,
      title: 'Modular Education Campus',
      subTitle: '2025 · Tokyo, JP — 교육',
      body: '미래 교육 수요에 따라 확장·축소 가능한 모듈러 캠퍼스. 학습 공간과 연구 공간의 유연한 재구성이 가능합니다.',
    },
    {
      no: 16,
      title: 'Responsive Public Bench System',
      subTitle: '2024 · New York, NY — 공공 가구',
      body: '사용자 행동과 날씨에 반응하는 벤치 시스템. 도시 가구를 통해 공공 공간의 활성도를 높입니다.',
    },
    {
      no: 15,
      title: '3D-Printed Coral Reef Restoration',
      subTitle: '2024 · Great Barrier Reef, AU — 환경 · 프로토타입',
      body: '산호 복원을 위한 3D 프린팅 구조물. 생태계 복원과 건축 기술의 융합 사례입니다.',
    },
    {
      no: 14,
      title: 'Hybrid Digital-Physical Workshop',
      subTitle: '2023 · Berlin, DE — 연구 인프라',
      body: '디지털 모델링과 피지컬 제작을 실시간 연결하는 워크숍 공간. 교육과 연구의 경계를 허뭅니다.',
    },
    {
      no: 13,
      title: 'Sustainable High-Rise Retrofit',
      subTitle: '2023 · London, UK — 고층 · 리노베이션',
      body: '기존 고층 빌딩에 적응형 외피와 그린 시스템을 추가한 리트로핏. 에너지 성능을 크게 향상시켰습니다.',
    },
    {
      no: 12,
      title: 'Algal Bio-Facade Prototype',
      subTitle: '2022 · Zurich, CH — 외피 · 연구',
      body: '조류를 활용한 바이오 외피. 광합성을 통해 에너지 생산과 공기 정화를 동시에 수행합니다.',
    },
    {
      no: 11,
      title: 'Community-Driven Modular Park',
      subTitle: '2022 · Boston, MA — 공공 공간',
      body: '주민 참여로 설계·조립되는 모듈러 공원. 유연한 프로그램과 지속가능한 재료를 강조합니다.',
    },
    {
      no: 10,
      title: 'Neural Network Optimized Tower',
      subTitle: '2026 · Singapore, SG — 고층',
      body: '신경망으로 형태와 구조를 최적화한 타워. 바람·일사·사용자 흐름을 종합 고려한 다중 성능 설계입니다.',
    },
    {
      no: 9,
      title: 'Earth-Based Robotic Construction',
      subTitle: '2025 · Marrakech, MA — 제작 · 지속가능',
      body: '로봇과 흙 기반 재료를 결합한 건설 시스템. 지역 자원 활용과 자동화의 미래를 제시합니다.',
    },
    // 기존 프로젝트 (no 8 ~ 1)
    {
      no: 8,
      title: 'Urban Living Lab',
      subTitle: '2026 · Boston, MA — 생활 실험과 도시 기록',
      body: '캠퍼스와 인근 커뮤니티를 연결하는 거주·연구 복합 공간. 거주자 참여 워크숍과 현장 측정을 바탕으로, 계절별 에너지·동선 데이터를 누적하며 “살아 있는 실험실”로 운영 중입니다.',
    },
    {
      no: 7,
      title: 'Parametric Pavilion',
      subTitle: '2025 · New York, NY — 설치 · 공공 프로그램',
      body: '곡면 패널을 모듈 단위로 나누어 현장에서 조립 가능한 키트로 설계했습니다. 야간 조명과 구조 응력이 동시에 시각화되도록, 하나의 기하에 기능과 퍼포먼스를 겹쳤습니다.',
    },
    {
      no: 6,
      title: 'Adaptive Facades',
      subTitle: '2025 · London, UK — 연구 · 프로토타입',
      body: '환경 센서 입력에 따라 개폐 각도가 달라지는 외피 유닛을 1:1로 시험했습니다. 바람·일사 조건에 따른 실내 환기율·조도 변화를 수치로 남기고, 다음 스케일업에 반영하는 중입니다.',
    },
    {
      no: 5,
      title: 'Modular Housing',
      subTitle: '2024 · Tokyo, JP — 주거',
      body: '공장 제작 모듈을 현장에서 볼트·키트로 연결해 기간·폐기물을 줄이는 구조를 검증했습니다. 가구·설비 잭(Jak)을 동일 그리드에 얹을 수 있게 해, 세대마다 면적은 같아도 쓰임은 달라지게 했습니다.',
    },
    {
      no: 4,
      title: 'Material Research Center',
      subTitle: '2024 · Zurich, CH — 문화시설',
      body: '신소재 토큐빈과 전시·실험동선을 겹쳤습니다. 샘플 보관, 단면 관찰, 짧은 강의가 한 층 안에서 전환되도록 동선·조도를 잠금 해제(Unlock)하는 방식으로 계획했습니다.',
    },
    {
      no: 3,
      title: 'Computational Design Lab',
      subTitle: '2023 · Berlin, DE — 연구 인프라',
      body: '팀·방문자가 스크립트·피지컬 모형을 오가며 쓰는 “탁상과 작업대가 같은 높이”인 환경을 목표로 했습니다. 서버·플로터·머시닝룸이 한 루프 안에서 서로의 출력물을 곧장 입력으로 넘깁니다.',
    },
    {
      no: 2,
      title: 'Sustainable Tower',
      subTitle: '2023 · Singapore, SG — 고층',
      body: '열섬과 단열을 동시에 겨냥한 이중 스킨·수직 그린에 대한 열·환기 시뮬레이션을 반복했습니다. 하부 공공 층과 상부 사무·조경 테라스의 부하를 분리해 운용 전략을 나눴습니다.',
    },
    {
      no: 1,
      title: 'Digital Fabrication Hub',
      subTitle: '2022 · Barcelona, ES — 제작 거점',
      body: '로봇암·CNC·3D 프린터가 한 동선에 묶이되, 먼지·소음 구역을 필터로 격리했습니다. 학과 간 예약·안전 프로토콜을 UI로 통일해, 장비 사용 로그를 그대로 수업과 이어지게 구성했습니다.',
    },
  ]

  const projects: WorkProject[] = [...projectSeeds]
    .sort((a, b) => b.no - a.no)
    .map((p) => ({
      ...p,
      imagesLeft: [0, 1, 2].map((s) => pics(p.no, 'L', s)),
      imagesRight: [0, 1, 2].map((s) => pics(p.no, 'R', s)),
    }))

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

    window.addEventListener('scroll', handleWindowScroll, { passive: true })
    handleWindowScroll()

    return () => {
      window.removeEventListener('scroll', handleWindowScroll)
      if (scrollTimeoutRef.current) {
        clearTimeout(scrollTimeoutRef.current)
      }
    }
  }, [scheduleRailHide])

  /** 터치 끝은 레일 밖에서 일어날 수 있어 window에서 해제 */
  useEffect(() => {
    if (!railPointerActive) return
    const end = () => {
      setRailPointerActive(false)
    }
    window.addEventListener('pointerup', end, { capture: true })
    window.addEventListener('pointercancel', end, { capture: true })
    return () => {
      window.removeEventListener('pointerup', end, { capture: true })
      window.removeEventListener('pointercancel', end, { capture: true })
    }
  }, [railPointerActive])

  /** 스크롤에 따라 active가 바뀌면, 고정 레일 안에서도 해당 버튼이 잘리지 않게 맞춤 */
  useEffect(() => {
    const el = railButtonRefs.current[activeProject]
    el?.scrollIntoView({ block: 'nearest', inline: 'nearest' })
  }, [activeProject])

  const scrollToProject = (index: number) => {
    projectRefs.current[index]?.scrollIntoView({
      behavior: 'smooth',
      block: 'center',
    })
  }

  const railVisible = isScrolling || railHover || railPointerActive

  const workProjectRail = (
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
            key={project.no}
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
  )

  return (
    <>
      <div className="pt-20 px-6">
        <div className="w-full min-w-0 max-w-page mx-auto py-20">
          <div className="grid grid-cols-1 gap-12">
            {projects.map((project, index) => (
              <WorkProjectSet
                key={project.no}
                project={project}
                onBlockRef={(el) => {
                  projectRefs.current[index] = el
                }}
              />
            ))}
          </div>
        </div>
      </div>
      {createPortal(workProjectRail, document.body)}
    </>
  )
}
