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
      subTitle: '2026 · Seoul, KR — Research · Prototype',
      body: 'A cutting-edge envelope system composed of biomimetic sensors and mycelium-based panels. It dynamically adapts to fluctuations in humidity and temperature, automatically triggering mechanisms for physical opening, closing, and color transition to regulate indoor microclimates. We are currently testing its dual capacity to mitigate the urban heat island effect and actively sequester carbon emissions, aiming to create a truly living building facade.',
    },
    {
      no: 49,
      title: 'Vertical Urban Farm Tower',
      subTitle: '2026 · Singapore, SG — High-Rise · Agriculture',
      body: 'An innovative tower integrating advanced vertical farming modules with residential living spaces. Utilizing state-of-the-art hydroponic systems and AI-driven cultivation management, this project significantly boosts local food self-sufficiency. Furthermore, it maximizes overall energy efficiency by creating a closed-loop system that continuously recycles waste heat and greywater from the residential units to nurture the agricultural zones.',
    },
    {
      no: 48,
      title: 'Robotic Clay Pavilion',
      subTitle: '2025 · Zurich, CH — Installation · Digital Fabrication',
      body: 'An architectural pavilion constructed through the on-site assembly of clay panels 3D-printed by robotic arms. By merging traditional pottery techniques with advanced parametric design, the project achieves a completely self-supporting structure without the need for additional reinforcement. The intricate geometry is carefully optimized to enhance natural ventilation and thermal mass, showcasing a sustainable approach to temporary structures.',
    },
    {
      no: 47,
      title: 'AI-Driven Community Hub',
      subTitle: '2025 · Boston, MA — Community · Research',
      body: 'A highly adaptive civic space that reflects real-time community engagement data. Utilizing generative AI algorithms, the hub continuously proposes and adjusts circulation paths and programmatic layouts based on usage patterns. Seasonal workshop areas and public gathering spaces are automatically reconfigured, ensuring the architecture remains highly responsive to the evolving needs and social dynamics of the local neighborhood.',
    },
    {
      no: 46,
      title: 'Floating Modular Housing',
      subTitle: '2025 · Amsterdam, NL — Housing · Climate Adaptation',
      body: 'A climate-resilient floating housing module designed specifically to adapt to rising sea levels. Featuring a prefabricated, bolted-connection system, these homes effortlessly rise and fall with floodwaters. The architectural design fully integrates solar panels and tidal energy capture technologies, supporting completely off-grid, self-sufficient living while minimizing the ecological footprint on vulnerable aquatic environments.',
    },
    {
      no: 45,
      title: 'Kinetic Shading Canopy',
      subTitle: '2024 · London, UK — Public Space · Installation',
      body: 'A dynamic kinetic canopy that autonomously responds to real-time wind speed and solar radiation data. Constructed with lightweight ETFE membranes and an integrated sensor network, the structure actively controls shade, natural light penetration, and ventilation. Beyond its environmental functions, the canopy acts as an engaging performative element, revitalizing the public plaza and interacting playfully with pedestrians below.',
    },
    {
      no: 44,
      title: 'Regenerative Timber High-Rise',
      subTitle: '2024 · Vancouver, CA — High-Rise · Sustainability',
      body: 'A radically configurable tower utilizing a modular mass timber structural system. Beyond its primary function as a massive carbon sink, the building allows for the physical relocation and reconfiguration of entire floors over time. This highly flexible approach significantly extends the building\'s lifecycle and strictly adheres to circular economy principles, drastically reducing future demolition and reconstruction waste.',
    },
    {
      no: 43,
      title: 'Mycelium Brick Lab',
      subTitle: '2024 · Berlin, DE — Material Research · Cultural Facility',
      body: 'A dedicated laboratory and exhibition space focused on the experimentation and display of mycelium-based bio-bricks. Researchers meticulously monitor the organic growth processes and structural integrity of the bricks under various environmental conditions. The facility serves as a testing ground for scaling up these low-carbon, biodegradable alternatives for mainstream commercial construction applications.',
    },
    {
      no: 42,
      title: 'Parametric Bamboo Pavilion',
      subTitle: '2024 · Tokyo, JP — Installation · Public Program',
      body: 'A temporary structure that leverages parametric design to modularize organic bamboo components. By digitally processing the raw materials before construction, on-site assembly time is drastically minimized. The project successfully implements a hybrid structural model that bridges the gap between ancient, traditional bamboo craftsmanship and modern, precision-driven digital fabrication technologies.',
    },
    {
      no: 41,
      title: 'Adaptive Waterfront Lab',
      subTitle: '2023 · Barcelona, ES — Research Infrastructure',
      body: 'An adaptive waterfront facility engineered as a direct response to accelerating sea-level rise. By combining a sensor-equipped floating platform with comprehensive environmental data collection spaces, the lab investigates the shifting boundary between urban environments and the ocean. It serves as an early-warning system and a prototype for resilient coastal architecture.',
    },
    {
      no: 40,
      title: 'Zero-Waste Fabrication Hub',
      subTitle: '2023 · New York, NY — Fabrication Hub',
      body: 'A digitally augmented fabrication facility where urban waste serves as the primary input material. Industrial robotic arms, CNC mills, and large-scale 3D printers process reclaimed timber, plastics, and metals in real-time. By establishing a strictly circular manufacturing process, the hub demonstrates how localized digital production can effectively eliminate construction and industrial waste.',
    },
    {
      no: 39,
      title: 'Hybrid Earth-Fiber Facade',
      subTitle: '2023 · Mexico City, MX — Prototype · Sustainability',
      body: 'A self-shading envelope prototype manufactured by 3D printing a proprietary mixture of locally sourced earth and natural reinforcement fibers. The complex geometry optimizes both thermal insulation performance and structural stability simultaneously. This project proposes a highly scalable, low-cost, and low-carbon architectural solution tailored specifically for warm, arid regional climates.',
    },
    {
      no: 38,
      title: 'Generative Urban Block',
      subTitle: '2023 · Seoul, KR — Urban Planning · Housing',
      body: 'An experimental urban block whose entire layout was generated through complex computational algorithms. The generative design process ensures a delicate balance between highly customized private floor plans for individual households and strategically placed communal spaces. This project tests a radical new model for high-density urban living that prioritizes daylight, ventilation, and social connectivity.',
    },
    {
      no: 37,
      title: 'Living Wall Research Center',
      subTitle: '2022 · Zurich, CH — Cultural Facility · Research',
      body: 'A specialized research center defined by its integration of massive vertical greenery and an expansive IoT sensor network. By correlating real-time ecological data with overall building performance metrics, the facility quantitatively measures the psychological and environmental impacts of biophilic design. It serves as both a scientific laboratory and a public showcase for living architecture.',
    },
    {
      no: 36,
      title: 'Modular Capsule Retrofit',
      subTitle: '2022 · Tokyo, JP — Housing · Renovation',
      body: 'A comprehensive architectural upgrade of a historic capsule tower using modern modular units. The retrofit drastically improves the building\'s energy efficiency and spatial flexibility while carefully preserving its iconic aesthetic. This project represents a contemporary reinterpretation of the 1970s Metabolism architectural movement, proving that historic avant-garde structures can be sustainably modernized.',
    },
    {
      no: 35,
      title: 'Climate-Responsive Pavilion',
      subTitle: '2026 · Sydney, AU — Installation · Public',
      body: 'A highly intelligent pavilion whose physical form morphs in direct response to fluctuating microclimatic conditions. Utilizing shape-memory alloys embedded within a parametric patterning system, the structure autonomously opens and closes its apertures. This seamless adaptation process constantly optimizes natural cross-ventilation and dynamic shading for the comfort of the public below.',
    },
    {
      no: 34,
      title: 'Circular Economy Housing',
      subTitle: '2025 · Copenhagen, DK — Housing',
      body: 'A radical residential development built entirely from fully separable and reusable modular components. The architectural detailing completely eliminates the use of toxic glues or permanent binders, aiming to minimize construction waste to near zero. Designed for absolute disassembly, the project targets a staggering material recovery rate of over 95% at the eventual end of the building\'s lifespan.',
    },
    {
      no: 33,
      title: 'Sensorial Material Library',
      subTitle: '2025 · London, UK — Material Research',
      body: 'An immersive, interactive library dedicated to the physical experience and rigorous testing of diverse smart materials. By meticulously cataloging the tactile, visual, and thermal properties of emerging materials into a centralized database, the facility provides invaluable support for architects and industrial designers seeking to make informed, sustainable, and sensorially rich design choices.',
    },
    {
      no: 32,
      title: 'Robotic Assembly Tower',
      subTitle: '2024 · Dubai, AE — High-Rise · Fabrication',
      body: 'An avant-garde skyscraper constructed utilizing a custom-designed, on-site robotic assembly system. By pioneering a hybrid methodology that merges off-site prefabrication with automated, autonomous on-site construction robots, the project achieves unprecedented levels of both speed and millimeter-precision, significantly reducing human labor risks in extreme climates.',
    },
    {
      no: 31,
      title: 'Biophilic Office Retrofit',
      subTitle: '2024 · Berlin, DE — Office · Sustainability',
      body: 'A holistic transformation of a conventional corporate office space through the strategic introduction of biophilic design elements. By scientifically optimizing the spatial arrangement of natural daylighting, diverse indoor plant species, and soothing water features, the retrofit has been proven to dramatically boost employee productivity, cognitive function, and overall psychological well-being.',
    },
    {
      no: 30,
      title: 'Parametric Soundscape Wall',
      subTitle: '2023 · Barcelona, ES — Public · Acoustics',
      body: 'An innovative urban partition wall where both acoustic performance and architectural aesthetics are parametrically optimized. The intricately folded, computationally derived surface geometry acts as an advanced sound baffle, significantly absorbing and deflecting harsh urban noise pollution. Simultaneously, it creates a striking visual rhythm that enhances the surrounding public streetscape.',
    },
    {
      no: 29,
      title: '3D-Printed Earthen School',
      subTitle: '2023 · Marrakech, MA — Education · Local',
      body: 'A pioneering educational facility constructed primarily through large-scale 3D printing of locally excavated, stabilized earth. This highly contextual approach yields a low-cost, inherently low-energy building that boasts exceptional passive cooling properties. The project not only provides a superior learning environment but also empowers the local community by transferring cutting-edge construction technology.',
    },
    {
      no: 28,
      title: 'Adaptive Reuse Warehouse',
      subTitle: '2022 · New York, NY — Cultural Facility',
      body: 'The sensitive architectural conversion of an abandoned industrial warehouse into a vibrant, multi-purpose cultural venue. The design strategy employs minimal structural interventions—focusing on localized reinforcement and the insertion of clear, modern circulation paths. This careful balancing act perfectly harmonizes the raw, historical character of the existing shell with clean, contemporary programmatic needs.',
    },
    {
      no: 27,
      title: 'AI-Optimized Facade System',
      subTitle: '2026 · Tokyo, JP — Research · Envelope',
      body: 'A state-of-the-art building envelope system that is continuously refined and optimized in real-time by advanced machine learning algorithms. This multi-objective optimization framework precisely balances competing demands: simultaneously minimizing overall building energy consumption while maximizing the localized thermal and visual comfort of the individual users inside.',
    },
    {
      no: 26,
      title: 'Floating Research Platform',
      subTitle: '2025 · Venice, IT — Research Infrastructure',
      body: 'A mobile, buoyant research platform engineered specifically to investigate the complex future of amphibious urbanism and floating cities. Its inherently modular design allows for rapid expansion and programmatic flexibility over time. The platform deeply integrates specialized marine ecology monitoring equipment, allowing researchers to study the reciprocal impacts between aquatic habitats and floating architecture.',
    },
    {
      no: 25,
      title: 'Modular Disaster Relief Unit',
      subTitle: '2025 · Manila, PH — Housing · Disaster Response',
      body: 'A highly engineered, rapidly deployable modular housing unit designed explicitly for immediate post-disaster relief scenarios. The structural frame is designed to be universally adaptable, seamlessly integrating with locally scavenged or sourced materials to form the exterior envelope. This ensures both rapid assembly speed and a high degree of cultural and climatic appropriateness.',
    },
    {
      no: 24,
      title: 'Kinetic Cultural Center',
      subTitle: '2024 · Paris, FR — Cultural Facility',
      body: 'A visionary cultural institution defined by its massive, mechanized architectural elements that allow for total programmatic flexibility. Entire walls, floors, and ceiling planes can be physically shifted to transform the internal volume. This kinetic capability dynamically links formerly separate visitor-participation galleries and acoustic performance spaces, fostering unexpected artistic collaborations.',
    },
    {
      no: 23,
      title: 'Carbon-Negative Pavilion',
      subTitle: '2024 · Zurich, CH — Installation',
      body: 'An experimental pavilion that achieves a true carbon-negative footprint through the exclusive use of bio-based materials and localized fabrication techniques. Beyond its structural achievements, the pavilion operates as an interactive educational tool. It is embedded with sensors that continuously display the amount of atmospheric carbon it has sequestered, serving as a powerful public statement on climate action.',
    },
    {
      no: 22,
      title: 'Generative Landscape Bridge',
      subTitle: '2023 · Singapore, SG — Infrastructure · Public',
      body: 'A structurally expressive pedestrian bridge whose complex, branching form was entirely dictated by generative design software optimizing for material efficiency. The bridge transcends its role as mere infrastructure by deeply integrating lush, tropical greenery and shaded resting zones along its span, effectively transforming a basic crossing into an elevated linear park that significantly enhances the urban landscape.',
    },
    {
      no: 21,
      title: 'Smart Grid Housing Cluster',
      subTitle: '2023 · Boston, MA — Housing',
      body: 'A localized cluster of residential units that are intrinsically linked to an advanced micro-energy grid. By pooling resources through a shared renewable energy generation and battery storage system, combined with predictive smart home technologies, the community maximizes its overall energy efficiency. The cluster functions as a unified, resilient power plant that dramatically reduces grid dependency.',
    },
    {
      no: 20,
      title: 'Bio-Fabricated Interior',
      subTitle: '2022 · London, UK — Interior · Research',
      body: 'A comprehensive interior design project where every major element was grown rather than manufactured. Utilizing mycelium composites and advanced bioplastics, everything from the bespoke furniture pieces to the acoustic wall claddings adheres to a strictly circular material lifecycle. At the end of their usefulness, the entire interior can be safely composted and returned to the earth.',
    },
    {
      no: 19,
      title: 'Urban Heat Island Mitigation Lab',
      subTitle: '2026 · Seoul, KR — Research',
      body: 'An open-air urban laboratory dedicated to rigorously testing and quantifying advanced strategies for mitigating the severe urban heat island effect. Researchers continuously monitor the complex, synergistic interactions between highly adaptive, reflective building envelopes and densely planted green infrastructure, producing actionable data for municipal zoning and future urban development policies.',
    },
    {
      no: 18,
      title: 'Parametric Timber Grid Shell',
      subTitle: '2025 · Barcelona, ES — Structure · Installation',
      body: 'A breathtaking timber gridshell structure generated via complex parametric modeling. By precisely calculating the internal stresses and bending radiuses of the raw lumber, the design achieves an extraordinary balance of visual lightness and immense structural rigidity. This technique allows for the efficient and elegant covering of massive, wide-span public spaces with minimal material usage.',
    },
    {
      no: 17,
      title: 'Modular Education Campus',
      subTitle: '2025 · Tokyo, JP — Education',
      body: 'A radically scalable educational campus constructed from standardized, prefabricated spatial modules. Designed to anticipate highly fluctuating student enrollments and evolving pedagogical methods, the campus can effortlessly expand, contract, or reconfigure its layout. This ensures a constant, flexible dialogue between quiet, focused learning environments and active, collaborative research spaces.',
    },
    {
      no: 16,
      title: 'Responsive Public Bench System',
      subTitle: '2024 · New York, NY — Public Furniture',
      body: 'A network of intelligent urban furniture that actively reacts to both human behavioral patterns and changing weather conditions. Integrated sensors detect ambient temperature and user presence, allowing the benches to subtly warm up during winter or illuminate specific social configurations at night. This project aims to significantly increase the safety, comfort, and general vibrancy of marginalized public spaces.',
    },
    {
      no: 15,
      title: '3D-Printed Coral Reef Restoration',
      subTitle: '2024 · Great Barrier Reef, AU — Environment · Prototype',
      body: 'A crucial ecological intervention featuring complex, 3D-printed ceramic structures designed to catalyze coral polyp attachment and reef regeneration. The intricate, biomimetic geometry of the artificial reefs mimics the complex micro-habitats of natural coral, offering protection from predators and ideal flow dynamics. It represents a vital synthesis of advanced architectural fabrication and marine biology.',
    },
    {
      no: 14,
      title: 'Hybrid Digital-Physical Workshop',
      subTitle: '2023 · Berlin, DE — Research Infrastructure',
      body: 'An innovative workspace designed to completely collapse the boundary between the virtual and physical realms of design. Utilizing advanced augmented reality and real-time robotic feedback loops, the workshop allows students and researchers to physically sculpt materials while simultaneously manipulating their corresponding digital twins, fostering a highly intuitive and frictionless educational environment.',
    },
    {
      no: 13,
      title: 'Sustainable High-Rise Retrofit',
      subTitle: '2023 · London, UK — High-Rise · Renovation',
      body: 'The ambitious, large-scale retrofit of an aging, energy-inefficient skyscraper. The intervention involved wrapping the existing structure in a secondary, highly adaptive thermal envelope and deeply integrating multi-story vertical green systems. These comprehensive upgrades have dramatically slashed the building\'s operational carbon footprint while vastly improving indoor air quality for the occupants.',
    },
    {
      no: 12,
      title: 'Algal Bio-Facade Prototype',
      subTitle: '2022 · Zurich, CH — Envelope · Research',
      body: 'A functioning, liquid-filled building envelope prototype utilizing living microalgae strains. As sunlight hits the transparent bioreactor panels, the algae undergo rapid photosynthesis, actively purifying the surrounding urban air while simultaneously generating harvestable biomass. This biomass is then converted into localized, renewable energy, proving the viability of buildings as active power generators.',
    },
    {
      no: 11,
      title: 'Community-Driven Modular Park',
      subTitle: '2022 · Boston, MA — Public Space',
      body: 'An agile, decentralized urban park system completely designed, iterated, and assembled through direct community participation. Utilizing a catalog of simple, sustainable, interlocking timber modules, local residents can customize the landscape to feature seating, planters, or performance stages. This democratized approach fosters a deep sense of neighborhood ownership and programmatic flexibility.',
    },
    {
      no: 10,
      title: 'Neural Network Optimized Tower',
      subTitle: '2026 · Singapore, SG — High-Rise',
      body: 'An avant-garde skyscraper whose complex aerodynamic massing and internal structural diagrid were entirely sculpted by advanced neural networks. The AI model conducted thousands of multi-objective simulations—balancing extreme wind load mitigation, optimal solar gain, and complex internal pedestrian flow dynamics—resulting in a highly idiosyncratic, yet perfectly performative, architectural form.',
    },
    {
      no: 9,
      title: 'Earth-Based Robotic Construction',
      subTitle: '2025 · Marrakech, MA — Fabrication · Sustainability',
      body: 'A revolutionary construction methodology that pairs mobile, heavy-duty robotic arms with raw, unprocessed earth materials excavated directly from the building site. This technique eliminates the massive carbon footprint associated with material transport and cement production. It presents a compelling, highly automated vision for the future of sustainable, contextually rooted vernacular architecture.',
    },
    {
      no: 8,
      title: 'Urban Living Lab',
      subTitle: '2026 · Boston, MA — Living Lab & Urban Documentation',
      body: 'A hybrid residential and research complex that directly bridges an academic campus with the adjacent local community. Operating as a true "living laboratory," the facility relies heavily on continuous resident participation through hands-on workshops and rigorous on-site measurements. By continuously accumulating hyper-local data on seasonal energy consumption and pedestrian circulation, the building constantly informs its own operational upgrades.',
    },
    {
      no: 7,
      title: 'Parametric Pavilion',
      subTitle: '2025 · New York, NY — Installation · Public Program',
      body: 'An intricate structural pavilion conceptualized as a massive kit-of-parts, allowing curved, parametrically designed panels to be rapidly assembled on-site. The architectural geometry is not merely aesthetic; it purposefully overlays function and performance into a single, cohesive form. Integrated night lighting is strategically mapped to highlight the varying structural stress points across the pavilion\'s complex, sweeping canopy.',
    },
    {
      no: 6,
      title: 'Adaptive Facades',
      subTitle: '2025 · London, UK — Research · Prototype',
      body: 'A rigorous 1:1 scale testing ground for kinetic envelope units whose opening angles are entirely dictated by live environmental sensor inputs. We meticulously record the corresponding changes in indoor ventilation rates and natural illuminance under vastly different wind and solar conditions. These massive datasets are currently being synthesized to dictate the precise mechanical tolerances required for the next commercial scale-up.',
    },
    {
      no: 5,
      title: 'Modular Housing',
      subTitle: '2024 · Tokyo, JP — Housing',
      body: 'A housing prototype designed to drastically reduce on-site construction timelines and material waste by relying on factory-produced modules connected via simplified bolt-and-kit systems. The true innovation lies in the standardized "Jack" infrastructure grid, which allows wildly different furniture and MEP setups to be easily plugged in. This ensures that while every unit shares the exact same square footage, the internal utility and character can be deeply personalized by the occupant.',
    },
    {
      no: 4,
      title: 'Material Research Center',
      subTitle: '2024 · Zurich, CH — Cultural Facility',
      body: 'A dynamic facility that purposefully intertwines raw material storage archives with public exhibition and active experimental zones. The architectural circulation is ingeniously designed around a concept of spatial "unlocking," where dynamic lighting shifts and movable partitions allow a single floorplate to seamlessly transition between secure sample preservation, microscopic section observation, and impromptu academic lectures within minutes.',
    },
    {
      no: 3,
      title: 'Computational Design Lab',
      subTitle: '2023 · Berlin, DE — Research Infrastructure',
      body: 'An open-plan laboratory engineered to enforce a completely flat, non-hierarchical workflow between digital scripting and physical modeling. The spatial layout is anchored by the concept of "desks and workbenches at the exact same height," promoting frictionless transitions between theory and making. Server racks, large-scale plotters, and CNC machining rooms are arranged in a continuous physical loop, ensuring that the output of one process immediately becomes the input for the next.',
    },
    {
      no: 2,
      title: 'Sustainable Tower',
      subTitle: '2023 · Singapore, SG — High-Rise',
      body: 'A high-rise development born from thousands of iterative thermal and computational fluid dynamics (CFD) simulations. The tower features a highly optimized double-skin facade and extensive vertical greenery specifically engineered to combat the urban heat island effect while maximizing internal insulation. The structural and mechanical strategy deliberately separates the immense thermal loads of the lower public plinth from the upper office and landscaped terrace zones to ensure maximum operational efficiency.',
    },
    {
      no: 1,
      title: 'Digital Fabrication Hub',
      subTitle: '2022 · Barcelona, ES — Fabrication Hub',
      body: 'A centralized manufacturing hub that elegantly organizes heavy industrial robotic arms, multi-axis CNC mills, and delicate 3D printers along a single, continuous circulation spine. While visually connected, severe dust and acoustic zones are completely isolated via advanced environmental filtration barriers. A unified, custom-built UI handles all cross-departmental scheduling and safety protocols, seamlessly turning raw machine usage logs into invaluable, real-time data for ongoing university seminars.',
    },
  ];

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
