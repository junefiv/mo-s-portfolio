import {Link} from 'react-router'

export default function Info() {
  return (
    <main className="px-6 pt-20">
      <div className="mx-auto w-full min-w-0 max-w-page py-20">
        <h1 className="mb-8 text-5xl tracking-tight md:text-7xl">INFO</h1>
        <p className="mb-6 max-w-prose text-base leading-relaxed text-foreground/85">
          Sanity에 News·Work·Fabrication 문서를 올릴 때는 로컬 개발 서버에서 아래 관리 화면을
          사용할 수 있습니다. (시크릿과 쓰기 토큰은 서버 환경 변수로만 두세요.)
        </p>
        <Link
          to="/admin"
          className="inline-flex min-h-11 min-w-0 items-center justify-center rounded-md border border-border bg-foreground px-5 text-sm font-medium text-background transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40 active:scale-[0.99]"
        >
          어드민 (콘텐츠 등록)
        </Link>
      </div>
    </main>
  )
}
