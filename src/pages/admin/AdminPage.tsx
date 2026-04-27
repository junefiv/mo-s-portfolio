import {useCallback, useId, useState, type FormEvent, type ReactNode} from 'react'
import {Link} from 'react-router'
import {
  adminAuth,
  adminPostMultipart,
  clearStoredAdminSecret,
  getStoredAdminSecret,
  setStoredAdminSecret,
} from '@/lib/adminApi'
import AdminToastListener from './AdminToastListener'
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
          setLoginErr(r.error ?? 'Login failed')
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
    <main className="min-w-0 px-6 pb-16">
      <AdminToastListener />
      <div className="mx-auto w-full min-w-0 max-w-page pt-page-below-nav pb-10">
        <div className="mb-8 flex min-w-0 flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="min-w-0">
            <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
              Content Admin
            </h1>
            
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
                Log out
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
              Admin secret
            </label>
            <input
              id={`${baseId}-secret`}
              type="password"
              autoComplete="off"
              value={loginSecret}
              onChange={(e) => setLoginSecret(e.target.value)}
              className={fieldClass}
              placeholder="Same value as PORTFOLIO_ADMIN_SECRET"
              required
            />
            {loginErr ? (
              <p className="whitespace-pre-wrap break-words text-sm text-destructive" role="alert">
                {loginErr}
              </p>
            ) : null}
            <button
              type="submit"
              disabled={loginBusy}
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-medium text-primary-foreground transition-opacity disabled:opacity-60"
            >
              {loginBusy ? 'Checking…' : 'Confirm'}
            </button>
          </form>
        ) : (
          <div className="min-w-0 space-y-8">
            <div
              role="tablist"
              aria-label="Content sections"
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
                aria-label="Work submenu"
                className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-3"
              >
                {(
                  [
                    ['new', 'New'],
                    ['archive', 'Archive · Edit'],
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
                aria-label="Fabrication submenu"
                className="flex min-w-0 flex-wrap gap-2 border-b border-border pb-3"
              >
                {(
                  [
                    ['new', 'New'],
                    ['archive', 'Archive · Edit'],
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
    setBusy(true)
    try {
      const fd = new FormData(form)
      const r = await adminPostMultipart('/api/admin/news', fd)
      if (r.ok) {
        setMsg(`Saved${r.id ? ` (id: ${r.id})` : ''}`)
        form.reset()
        setFileKey((k) => k + 1)
      } else {
        setErr(r.error ?? 'Failed')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
      <Field label="Title" htmlFor={`${id}-title`}>
        <input id={`${id}-title`} name="title" required className={fieldClass} />
      </Field>
      <Field label="Date" htmlFor={`${id}-date`}>
        <input id={`${id}-date`} name="date" type="date" required className={fieldClass} />
      </Field>
      <Field label="Body" htmlFor={`${id}-body`}>
        <textarea id={`${id}-body`} name="body" required rows={8} className={fieldClass} />
      </Field>
      <Field label="Images (multiple)" htmlFor={`${id}-img`}>
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
        {busy ? 'Uploading…' : 'Create News'}
      </button>
      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p> : null}
      {err ? (
        <p className="whitespace-pre-wrap break-words text-sm text-destructive" role="alert">
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
    setBusy(true)
    try {
      const fd = new FormData(form)
      const r = await adminPostMultipart('/api/admin/work', fd)
      if (r.ok) {
        setMsg(`Saved${r.id ? ` (id: ${r.id})` : ''}`)
        form.reset()
        setFileKey((k) => k + 1)
      } else {
        setErr(r.error ?? 'Failed')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
      <p className="text-sm text-muted-foreground">
        Sort numbers are assigned automatically by the server. You can edit order, content, and images in Work → Archive · Edit.
      </p>
      <Field label="Title" htmlFor={`${id}-title`}>
        <input id={`${id}-title`} name="title" required className={fieldClass} />
      </Field>
      <Field label="Subtitle (sub_title)" htmlFor={`${id}-sub`}>
        <input id={`${id}-sub`} name="sub_title" className={fieldClass} />
      </Field>
      <Field label="Body" htmlFor={`${id}-body`}>
        <textarea id={`${id}-body`} name="body" required rows={8} className={fieldClass} />
      </Field>
      <Field label="Drawing images — left column (multiple)" htmlFor={`${id}-left`}>
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
      <Field label="Artwork images — right column (multiple)" htmlFor={`${id}-right`}>
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
        {busy ? 'Uploading…' : 'Create Work'}
      </button>
      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p> : null}
      {err ? (
        <p className="whitespace-pre-wrap break-words text-sm text-destructive" role="alert">
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
    setBusy(true)
    try {
      const fd = new FormData(form)
      const r = await adminPostMultipart('/api/admin/fabrication', fd)
      if (r.ok) {
        setMsg(`Saved${r.id ? ` (id: ${r.id})` : ''}`)
        form.reset()
        setFileKey((k) => k + 1)
      } else {
        setErr(r.error ?? 'Failed')
      }
    } finally {
      setBusy(false)
    }
  }

  return (
    <form onSubmit={onSubmit} className="mx-auto max-w-xl space-y-5">
      <p className="text-sm text-muted-foreground">
        Items are automatically assigned so newer entries appear first. You can edit order, content, and images in Fabrication → Archive · Edit.
      </p>
      <Field label="Year" htmlFor={`${id}-year`}>
        <input id={`${id}-year`} name="year" required className={fieldClass} placeholder="2026" />
      </Field>
      <Field label="Title" htmlFor={`${id}-title`}>
        <input id={`${id}-title`} name="title" required className={fieldClass} />
      </Field>
      <Field label="Subtitle (sub_title)" htmlFor={`${id}-sub`}>
        <input id={`${id}-sub`} name="sub_title" className={fieldClass} />
      </Field>
      <Field label="Category" htmlFor={`${id}-cat`}>
        <input id={`${id}-cat`} name="category" className={fieldClass} placeholder="e.g. Workshop" />
      </Field>
      <Field label="Body" htmlFor={`${id}-body`}>
        <textarea id={`${id}-body`} name="body" required rows={8} className={fieldClass} />
      </Field>
      <Field label="Images (multiple)" htmlFor={`${id}-img`}>
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
        {busy ? 'Uploading…' : 'Create Fabrication'}
      </button>
      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p> : null}
      {err ? (
        <p className="whitespace-pre-wrap break-words text-sm text-destructive" role="alert">
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
