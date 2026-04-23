type NewsItem = {
  id: string
  /** ISO `YYYY-MM-DD` — 정렬·`<time dateTime>`용 */
  date: string
  title: string
  body: string
  image: string
}

const NEWS_ITEMS: NewsItem[] = [
  {
    id: 'n-6',
    date: '2026-04-18',
    title: 'Seoul Architecture Festival Panel Talk',
    body: 'We participated in an insightful panel discussion at the Seoul Architecture Festival, focusing on the critical challenges of translating digitWe participated in an insightful panel discussion at the Seoul Architecture Festival, focusing on the critical challenges of translating digitWe participated in an insightful panel discussion at the Seoul Architecture Festival, focusing on the critical challenges of translating digitWe participated in an insightful panel discussion at the Seoul Architecture Festival, focusing on the critical challenges of translating digital designs into physical realities. The conversation highlighted innovative collaborative workflows and recent case studies that successfully bridge the historical gap between high-precision digital fabrication methods and the unpredictable variables of on-site construction.',
    image: 'https://picsum.photos/seed/news-n6/800/800',
  },
  {
    id: 'n-5',
    date: '2026-03-02',
    title: 'Architects Institute Journal Interview',
    body: 'We were recently featured in an in-depth interview with the Architects Institute Journal. The discussion explored our unique operational philosophy, specifically how we seamlessly integrate rigorous academic research lab management with ongoing educational curriculum demands. Furthermore, we shared our comprehensive strategies for systematically archiving and exhibiting student work to foster continuous knowledge transfer within the institution.',
    image: 'https://picsum.photos/seed/news-n5/800/800',
  },
  {
    id: 'n-4',
    date: '2025-11-20',
    title: 'International Workshop "Material Loop"',
    body: 'We hosted "Material Loop," a multi-day international workshop dedicated to circular economy principles in architecture. Participants engaged in hands-on sessions that paired our extensive physical material sample library with custom Life Cycle Assessment (LCA) computational worksheets. The core objective was to empower designers to proactively trace and visualize potential waste pathways and material life-spans from the very earliest stages of the schematic design process.',
    image: 'https://picsum.photos/seed/news-n4/800/800',
  },
  {
    id: 'n-3',
    date: '2025-08-07',
    title: 'Gallery Solo Exhibition Opening',
    body: 'We successfully launched the opening reception for our latest solo gallery exhibition. The curated spatial arrangement deliberately juxtaposed our recent series of highly detailed, small-scale physical prototypes alongside immersive, large-format architectural prints. This curated tension within the gallery space was designed to explicitly illustrate the drastic shifts in scale, resolution, and materiality that occur throughout our iterative digital production process.',
    image: 'https://picsum.photos/seed/news-n3/800/800',
  },
  {
    id: 'n-2',
    date: '2025-04-15',
    title: 'Research Grant Project Kick-off',
    body: 'We are thrilled to announce the official kick-off of a major, fully funded three-year academic research grant. This ambitious project aims to fundamentally rethink human-machine collaboration on construction sites. Our primary focus will be engineering a robust, integrated system that seamlessly merges physical safety interlock mechanisms on large-scale robotic assembly lines with highly intuitive, augmented reality-based User Interfaces (UI) for on-site human operators.',
    image: 'https://picsum.photos/seed/news-n2/800/800',
  },
  {
    id: 'n-1',
    date: '2024-12-01',
    title: 'Year-End Open Studio',
    body: 'To close out the year, we transformed our workspace into a public forum for our annual Year-End Open Studio event. We opened our digital and physical archives, exhibiting a vast array of work-in-progress physical models, complex computational scripts, and immersive process videos. The event culminated in a vibrant, interactive feedback session, fostering invaluable dialogue between our core research team, industry professionals, and the general public.',
    image: 'https://picsum.photos/seed/news-n1/800/800',
  },
];

function formatNewsDate(iso: string) {
  const d = new Date(`${iso}T12:00:00`)
  return d.toLocaleDateString('ko-KR', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export default function News() {
  const sorted = [...NEWS_ITEMS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
  )

  return (
    <main className="min-w-0 px-6 pt-20">
      <div className="mx-auto w-full min-w-0 max-w-page py-20">
        

        <ul className="grid min-w-0 list-none grid-cols-1 gap-x-6 gap-y-12 sm:grid-cols-2 sm:gap-x-8 sm:gap-y-5">
          {sorted.map((item) => (
            <li key={item.id} className="min-w-0">
              <article className="flex min-w-0 flex-col gap-1.5">
                <div className="aspect-square w-full min-w-0 overflow-hidden rounded-sm bg-muted">
                  <img
                    src={item.image}
                    alt=""
                    className="h-full w-full object-cover"
                    loading="lazy"
                    decoding="async"
                  />
                </div>
                <h2 className="text-xl font-medium leading-snug tracking-tight text-foreground">
                  {item.title}
                </h2>
                <time
                  dateTime={item.date}
                  className="text-sm text-muted-foreground"
                >
                  {formatNewsDate(item.date)}
                </time>
                <p className="text-sm leading-relaxed text-foreground/90">
                  {item.body}
                </p>
              </article>
            </li>
          ))}
        </ul>
      </div>
    </main>
  )
}
