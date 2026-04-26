import {useCallback, useId, useState, type FormEvent, type ReactNode} from 'react'
import {Link} from 'react-router'
import {
  adminAuth,
  adminPostMultipart,
  clearStoredAdminSecret,
  getStoredAdminSecret,
  setStoredAdminSecret,
} from '@/lib/adminApi'
import FabricationArchivePanel from './FabricationArchivePanel'
import WorkArchivePanel from './WorkArchivePanel'

const fieldClass =
  'min-w-0 w-full rounded-md border border-border bg-[var(--input-background)] px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'

const labelClass = 'mb-1.5 block text-sm font-medium text-foreground/90'

type Tab = 'news' | 'work' | 'fabrication'
type SectionSub = 'new' | 'archive'

export default function AdminPage() {
  const baseId = useId()
  const [authed, setAuthed] = useState(() =>
    typeof globalThis !== 'undefined' && 'sessionStorage' in globalThis
      ? !!getStoredAdminSecret()
      : false,
  )
  const [tab, setTab] = useState<Tab>('news')
  const [workSub, setWorkSub] = useState<SectionSub>('new')
  const [fabSub, setFabSub] = useState<SectionSub>('new')

  const [loginSecret, setLoginSecret] = useState('')
  const [loginErr, setLoginErr] = useState<string | null>(null)
  const [loginBusy, setLoginBusy] = useState(false)

  const onLogin = useCallback(
    async (e: FormEvent) => {
      e.preventDefault()
      setLoginErr(null)
      setLoginBusy(true)
      try {
        const r = await adminAuth(loginSecret.trim())
        if (r.ok) {
          setStoredAdminSecret(loginSecret.trim())
          setAuthed(true)
          setLoginSecret('')
        } else {
          setLoginErr(r.error ?? '로그인 실패')
        }
      } finally {
        setLoginBusy(false)
      }
    },
    [loginSecret],
  )

  const onLogout = useCallback(() => {
    clearStoredAdminSecret()
    setAuthed(false)
  }, [])

  return (
    <main className="min-w-0 px-6 pt-20 pb-16">
      <div className="mx-auto w-full min-w-0 max-w-page py-10">
        <div className="mb-8 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              콘텐츠 등록
            </h1>
            <p className="mt-2 max-w-prose text-sm leading-relaxed text-foreground/75">
              Sanity 데이터셋에 문서를 추가합니다. 로컬{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">npm run dev</code>에서는
              시크릿을 안 적어도 기본값{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">123456</code>이 적용됩니다.
              쓰기 토큰은 반드시 루트{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">.env.local</code>의{' '}
              <code className="rounded bg-muted px-1 py-0.5 text-xs">SANITY_API_WRITE_TOKEN</code>
              이 필요합니다.
            </p>
          </div>
          <div className="flex shrink-0 flex-wrap items-center gap-3">
            <Link
              to="/info"
              className="text-sm text-foreground/80 underline-offset-4 hover:text-foreground hover:underline"
            >
              ← INFO
            </Link>
            {authed ? (
              <button
                type="button"
                onClick={onLogout}
                className="rounded-md border border-border bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted/60"
              >
                로그아웃
              </button>
            ) : null}
          </div>
        </div>

        {!authed ? (
          <form
            onSubmit={onLogin}
            className="mx-auto max-w-md space-y-4 rounded-lg border border-border bg-card p-6 shadow-sm"
          >
            <label htmlFor={`${baseId}-secret`} className={labelClass}>
              관리 시크릿
            </label>
            <input
              id={`${baseId}-secret`}
              type="password"
              autoComplete="off"
              value={loginSecret}
              onChange={(e) => setLoginSecret(e.target.value)}
              className={fieldClass}
              placeholder="PORTFOLIO_ADMIN_SECRET와 동일한 값"
              required
            />
            {loginErr ? (
              <p className="text-sm text-destructive" role="alert">
                {loginErr}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loginBusy}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {loginBusy ? '확인 중…' : '확인'}
            </button>
          </form>
        ) : (
          <div className="min-w-0 space-y-8">
            <div
              role="tablist"
              aria-label="등록 종류"
              className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-3"
            >
              {(
                [
                  ['news', 'News'],
                  ['work', 'Work'],
                  ['fabrication', 'Fabrication'],
                ] as const
              ).map(([id, label]) => (
                <button
                  key={id}
                  type="button"
                  role="tab"
                  aria-selected={tab === id}
                  onClick={() => {
                    setTab(id)
                    if (id === 'work') setWorkSub('new')
                    if (id === 'fabrication') setFabSub('new')
                  }}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    tab === id
                      ? 'bg-foreground text-background'
                      : 'bg-muted/50 text-foreground/80 hover:bg-muted'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>

            {tab === 'work' ? (
              <div
                role="tablist"
                aria-label="Work 하위 메뉴"
                className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-3"
              >
                {(
                  [
                    ['new', '새 등록'],
                    ['archive', '아카이브 · 에디트'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={workSub === id}
                    onClick={() => setWorkSub(id)}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                      workSub === id
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-muted/40 text-foreground/75 hover:bg-muted/70'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            {tab === 'fabrication' ? (
              <div
                role="tablist"
                aria-label="Fabrication 하위 메뉴"
                className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-3"
              >
                {(
                  [
                    ['new', '새 등록'],
                    ['archive', '아카이브 · 에디트'],
                  ] as const
                ).map(([id, label]) => (
                  <button
                    key={id}
                    type="button"
                    role="tab"
                    aria-selected={fabSub === id}
                    onClick={() => setFabSub(id)}
                    className={`rounded-md px-3 py-2 text-xs font-medium transition-colors sm:text-sm ${
                      fabSub === id
                        ? 'bg-secondary text-secondary-foreground'
                        : 'bg-muted/40 text-foreground/75 hover:bg-muted/70'
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            {tab === 'news' ? <NewsForm /> : null}
            {tab === 'work' && workSub === 'new' ? <WorkForm /> : null}
            {tab === 'work' && workSub === 'archive' ? <WorkArchivePanel /> : null}
            {tab === 'fabrication' && fabSub === 'new' ? <FabricationForm /> : null}
            {tab === 'fabrication' && fabSub === 'archive' ? <FabricationArchivePanel /> : null}
          </div>
        )}
      </div>
    </main>
  )
}

function NewsForm() {
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [fileKey, setFileKey] = useState(0)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setMsg(null)
    setErr(null)
    const fd = new FormData(form)
    setBusy(true)
    try {
      const r = await adminPostMultipart('/api/admin/news', fd)
      if (r.ok) {
        setMsg(`저장됨${r.id ? ` (id: ${r.id})` : ''}`)
        form.reset()
        setFileKey((k) => k + 1)
      } else {
        setErr(r.error ?? '실패')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
      <Field label="제목" htmlFor={`${id}-title`}>
        <input id={`${id}-title`} name="title" required className={fieldClass} />
      </Field>
      <Field label="날짜" htmlFor={`${id}-date`}>
        <input id={`${id}-date`} name="date" type="date" required className={fieldClass} />
      </Field>
      <Field label="본문" htmlFor={`${id}-body`}>
        <textarea id={`${id}-body`} name="body" required rows={8} className={fieldClass} />
      </Field>
      <Field label="이미지 (여러 장)" htmlFor={`${id}-img`}>
        <input
          key={fileKey}
          id={`${id}-img`}
          name="images"
          type="file"
          accept="image/*"
          multiple
          required
          className={`${fieldClass} py-2 file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium`}
        />
      </Field>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {busy ? '업로드 중…' : 'News 등록'}
      </button>
      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p> : null}
      {err ? (
        <p className="text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}
    </form>
  )
}

function WorkForm() {
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [fileKey, setFileKey] = useState(0)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setMsg(null)
    setErr(null)
    const fd = new FormData(form)
    setBusy(true)
    try {
      const r = await adminPostMultipart('/api/admin/work', fd)
      if (r.ok) {
        setMsg(`저장됨${r.id ? ` (id: ${r.id})` : ''}`)
        form.reset()
        setFileKey((k) => k + 1)
      } else {
        setErr(r.error ?? '실패')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
      <p className="text-sm text-muted-foreground">
        정렬 번호는 서버에서 자동 부여됩니다. 순서·내용·이미지는 Work →「아카이브 · 에디트」에서 바꿀 수 있습니다.
      </p>
      <Field label="제목" htmlFor={`${id}-title`}>
        <input id={`${id}-title`} name="title" required className={fieldClass} />
      </Field>
      <Field label="부제 (sub_title)" htmlFor={`${id}-sub`}>
        <input id={`${id}-sub`} name="sub_title" className={fieldClass} />
      </Field>
      <Field label="본문" htmlFor={`${id}-body`}>
        <textarea id={`${id}-body`} name="body" required rows={8} className={fieldClass} />
      </Field>
      <Field label="도면 이미지 — 왼쪽 박스 (여러 장)" htmlFor={`${id}-left`}>
        <input
          key={`${fileKey}-L`}
          id={`${id}-left`}
          name="imagesLeft"
          type="file"
          accept="image/*"
          multiple
          required
          className={`${fieldClass} py-2 file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium`}
        />
      </Field>
      <Field label="작품 이미지 — 오른쪽 박스 (여러 장)" htmlFor={`${id}-right`}>
        <input
          key={`${fileKey}-R`}
          id={`${id}-right`}
          name="imagesRight"
          type="file"
          accept="image/*"
          multiple
          required
          className={`${fieldClass} py-2 file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium`}
        />
      </Field>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {busy ? '업로드 중…' : 'Work 등록'}
      </button>
      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p> : null}
      {err ? (
        <p className="text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}
    </form>
  )
}

function FabricationForm() {
  const id = useId()
  const [busy, setBusy] = useState(false)
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [fileKey, setFileKey] = useState(0)

  const onSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const form = e.currentTarget
    setMsg(null)
    setErr(null)
    const fd = new FormData(form)
    setBusy(true)
    try {
      const r = await adminPostMultipart('/api/admin/fabrication', fd)
      if (r.ok) {
        setMsg(`저장됨${r.id ? ` (id: ${r.id})` : ''}`)
        form.reset()
        setFileKey((k) => k + 1)
      } else {
        setErr(r.error ?? '실패')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
      <p className="text-sm text-muted-foreground">
        목록 순서는 자동으로 맨 위에 쌓이게 부여됩니다. 순서·내용·이미지는 Fabrication →「아카이브 · 에디트」에서
        바꿀 수 있습니다.
      </p>
      <Field label="연도 (year)" htmlFor={`${id}-year`}>
        <input id={`${id}-year`} name="year" required className={fieldClass} placeholder="2026" />
      </Field>
      <Field label="제목" htmlFor={`${id}-title`}>
        <input id={`${id}-title`} name="title" required className={fieldClass} />
      </Field>
      <Field label="부제 (sub_title)" htmlFor={`${id}-sub`}>
        <input id={`${id}-sub`} name="sub_title" className={fieldClass} />
      </Field>
      <Field label="카테고리" htmlFor={`${id}-cat`}>
        <input id={`${id}-cat`} name="category" className={fieldClass} placeholder="Workshop 등" />
      </Field>
      <Field label="본문" htmlFor={`${id}-body`}>
        <textarea id={`${id}-body`} name="body" required rows={8} className={fieldClass} />
      </Field>
      <Field label="이미지 (여러 장)" htmlFor={`${id}-img`}>
        <input
          key={fileKey}
          id={`${id}-img`}
          name="images"
          type="file"
          accept="image/*"
          multiple
          required
          className={`${fieldClass} py-2 file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium`}
        />
      </Field>
      <button
        type="submit"
        disabled={busy}
        className="rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
      >
        {busy ? '업로드 중…' : 'Fabrication 등록'}
      </button>
      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p> : null}
      {err ? (
        <p className="text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}
    </form>
  )
}

function Field({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor: string
  children: ReactNode
}) {
  return (
    <div className="min-w-0">
      <label htmlFor={htmlFor} className={labelClass}>
        {label}
      </label>
      {children}
    </div>
  )
}
