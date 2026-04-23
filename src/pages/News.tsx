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
    title: '서울 건축문화제 패널 토크',
    body: '디지털 제작과 현장 시공의 간극을 줄이는 협업 사례를 중심으로 논의했습니다.',
    image: 'https://picsum.photos/seed/news-n6/800/800',
  },
  {
    id: 'n-5',
    date: '2026-03-02',
    title: '건축사협회지 인터뷰',
    body: '연구실 운영과 교육 과제를 병행하는 방식, 그리고 학생 작업의 아카이빙 전략을 소개했습니다.',
    image: 'https://picsum.photos/seed/news-n5/800/800',
  },
  {
    id: 'n-4',
    date: '2025-11-20',
    title: '국제 워크숍 “Material Loop”',
    body: '재료 샘플 라이브러리와 LCA 워크시트를 묶어, 설계 단계에서 폐기물 경로를 시각화하는 실습을 진행했습니다.',
    image: 'https://picsum.photos/seed/news-n4/800/800',
  },
  {
    id: 'n-3',
    date: '2025-08-07',
    title: '갤러리 개인전 오프닝',
    body: '최근 프로토타입 시리즈와 대형 프린트를 한 공간에 배치해, 제작 과정의 스케일 변화를 보여주었습니다.',
    image: 'https://picsum.photos/seed/news-n3/800/800',
  },
  {
    id: 'n-2',
    date: '2025-04-15',
    title: '연구비 과제 킥오프',
    body: '로보틱 조립 라인의 안전 인터록과 작업자 UI를 통합하는 3년 과제가 시작되었습니다.',
    image: 'https://picsum.photos/seed/news-n2/800/800',
  },
  {
    id: 'n-1',
    date: '2024-12-01',
    title: '연말 오픈 스튜디오',
    body: '진행 중인 모형·스크립트·영상 자료를 공개하고, 방문객과 피드백 세션을 열었습니다.',
    image: 'https://picsum.photos/seed/news-n1/800/800',
  },
]

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
