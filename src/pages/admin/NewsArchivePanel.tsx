import {
  startTransition,
  useCallback,
  useEffect,
  useId,
  useState,
  type FormEvent,
  type ReactNode,
} from 'react'
import {adminGetJson, adminPostJson, adminPostJsonData, adminPostMultipart} from '@/lib/adminApi'
import {formDataWithResizedImages} from '@/lib/adminImageResize'
import {showAdminToast} from '@/lib/adminToast'
import {
  AdminSortableImageSlotStrip,
  serializeSlotsForMultipart,
  slotsFromUrlList,
  type AdminImgSlotRow,
} from './AdminSortableImageSlots'
import {GermanDateInput} from './GermanDateInput'

type Row = {_id: string; title: string | null; publishedAt: string | null}

type NewsDoc = {
  _id: string
  title: string | null
  publishedAt: string | null
  body: string | null
  images: (string | null)[] | null
}

const fieldClass =
  'min-w-0 w-full rounded-md border border-border bg-[var(--input-background)] px-3 py-2 text-base text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/40'

function Field({label, htmlFor, children}: {label: string; htmlFor: string; children: ReactNode}) {
  return (
    <div className="min-w-0 space-y-1.5">
      <label htmlFor={htmlFor} className="block text-sm font-medium text-foreground">
        {label}
      </label>
      {children}
    </div>
  )
}

function dateInputValue(iso: string | null): string {
  if (!iso) return ''
  const s = iso.slice(0, 10)
  return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : ''
}

function ListRow({
  title,
  subtitle,
  onEdit,
  onDelete,
}: {
  title: string
  subtitle: string
  onEdit: () => void
  onDelete: () => void
}) {
  return (
    <div className="flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-sm sm:flex-nowrap sm:gap-3">
      <div className="min-w-0 flex-1">
        <p className="truncate font-medium text-foreground">{title}</p>
        {subtitle ? <p className="truncate text-xs text-muted-foreground">{subtitle}</p> : null}
      </div>
      <div className="flex shrink-0 gap-2">
        <button
          type="button"
          onClick={onEdit}
          className="rounded border border-border bg-background px-2 py-1 text-xs font-medium text-foreground hover:bg-muted"
        >
          Edit
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded border border-destructive/50 bg-background px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
        >
          Delete
        </button>
      </div>
    </div>
  )
}

function NewsEditForm({
  docId,
  onClose,
  onSaved,
}: {
  docId: string
  onClose: () => void
  onSaved: () => void
}) {
  const formId = useId()
  const [doc, setDoc] = useState<NewsDoc | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [rmImg, setRmImg] = useState<Set<number>>(() => new Set())
  const [imgSlots, setImgSlots] = useState<AdminImgSlotRow[]>([])

  useEffect(() => {
    return () => {
      setImgSlots((prev) => {
        prev.forEach((s) => {
          if (s.kind === 'pending') URL.revokeObjectURL(s.pending.url)
        })
        return []
      })
    }
  }, [])

  useEffect(() => {
    setRmImg(new Set())
    setImgSlots((prev) => {
      prev.forEach((s) => {
        if (s.kind === 'pending') URL.revokeObjectURL(s.pending.url)
      })
      return []
    })
  }, [docId])

  useEffect(() => {
    let cancelled = false
    setLoadErr(null)
    setDoc(null)
    void (async () => {
      const r = await adminPostJsonData<{ok: boolean; doc?: NewsDoc; error?: string}>(
        '/api/admin/news-fetch',
        {id: docId},
      )
      if (cancelled) return
      if (!r.ok || !r.data?.doc) {
        setLoadErr(r.error ?? 'Failed to load')
        return
      }
      setDoc(r.data.doc)
    })()
    return () => {
      cancelled = true
    }
  }, [docId])

  useEffect(() => {
    if (!doc) return
    setImgSlots(slotsFromUrlList(doc.images))
  }, [doc])

  const clearPending = () => {
    setImgSlots((prev) => {
      prev.forEach((s) => {
        if (s.kind === 'pending') URL.revokeObjectURL(s.pending.url)
      })
      return prev.filter((s) => s.kind === 'existing')
    })
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!doc) return
    setBusy(true)
    const form = e.currentTarget
    const title = (form.elements.namedItem('title') as HTMLInputElement | null)?.value ?? ''
    const date = (form.elements.namedItem('date') as HTMLInputElement | null)?.value ?? ''
    const body = (form.elements.namedItem('body') as HTMLTextAreaElement | null)?.value ?? ''
    const fd = new FormData()
    fd.append('_id', doc._id)
    fd.append('title', title)
    fd.append('date', date)
    fd.append('body', body)
    fd.append('remove_image_indexes', [...rmImg].sort((a, b) => a - b).join(','))
    const ser = serializeSlotsForMultipart(imgSlots, rmImg)
    fd.append('image_slots', ser.json)
    for (const f of ser.files) {
      fd.append('images', f, f.name || 'image.jpg')
    }
    try {
      const fdOut = await formDataWithResizedImages(fd)
      const r = await adminPostMultipart('/api/admin/news-update', fdOut)
      if (r.ok) {
        showAdminToast('Saved successfully.', 'success')
        onSaved()
      } else {
        showAdminToast(r.error ?? 'Failed to save.', 'error')
      }
    } catch {
      showAdminToast('Failed to save due to a network error.', 'error')
    } finally {
      setBusy(false)
    }
  }

  if (loadErr) {
    return (
      <div className="whitespace-pre-wrap break-words rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {loadErr}
        <button type="button" className="ml-3 underline" onClick={onClose}>
          Close
        </button>
      </div>
    )
  }

  if (!doc) {
    return <p className="text-sm text-muted-foreground">Loading…</p>
  }

  return (
    <form
      encType="multipart/form-data"
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Edit News</p>
        <button type="button" onClick={onClose} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Close
        </button>
      </div>
      <Field label="Title" htmlFor={`${formId}-title`}>
        <input id={`${formId}-title`} name="title" required defaultValue={doc.title ?? ''} className={fieldClass} />
      </Field>
      <Field label="Date" htmlFor={`${formId}-date`}>
        <GermanDateInput
          id={`${formId}-date`}
          name="date"
          required
          defaultIso={dateInputValue(doc.publishedAt)}
          className={fieldClass}
        />
      </Field>
      <Field label="Body" htmlFor={`${formId}-body`}>
        <textarea
          id={`${formId}-body`}
          name="body"
          required
          rows={8}
          defaultValue={doc.body ?? ''}
          className={fieldClass}
        />
      </Field>
      <p className="text-xs text-muted-foreground">
      ⋮⋮←You can change the order with the handle. The × button is scheduled to be deleted. You can add an image with the + button, and the orange border is waiting for upload before saving.
      </p>
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-medium text-foreground">Images</p>
        <AdminSortableImageSlotStrip
          slots={imgSlots}
          setSlots={setImgSlots}
          rmExisting={rmImg}
          onToggleExistingRemove={(origIndex) => {
            setRmImg((prev) => {
              const n = new Set(prev)
              if (n.has(origIndex)) n.delete(origIndex)
              else n.add(origIndex)
              return n
            })
          }}
          pickInputId={`${formId}-pick-img`}
          addLabel="Add images"
          onToast={(m) => showAdminToast(m, 'success')}
          sideLabel="Image"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? 'Saving…' : 'Save'}
        </button>
        <button type="button" onClick={clearPending} className="rounded-md border border-border px-3 py-2 text-sm">
          Clear all selected files
        </button>
      </div>
    </form>
  )
}

export default function NewsArchivePanel() {
  const [items, setItems] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const r = await adminGetJson<{ok: boolean; items: Row[]}>('/api/admin/news-list')
    if (!r.ok || !r.data?.items) {
      setErr(r.error ?? 'Unable to load the list.')
      setItems([])
    } else {
      setItems(r.data.items)
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    startTransition(() => {
      void load()
    })
  }, [load])

  const onDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This will be permanently removed from Sanity.`)) return
    setErr(null)
    const r = await adminPostJson('/api/admin/news-delete', {id})
    if (!r.ok) {
      const why = r.error ?? 'Delete failed.'
      setErr(why)
      showAdminToast(why, 'error')
      return
    }
    if (editingId === id) setEditingId(null)
    showAdminToast('Deleted.', 'success')
    void load()
  }

  if (loading) return <p className="text-sm text-muted-foreground">Loading list…</p>

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="text-sm leading-relaxed text-foreground/75">
      Displayed in the latest order of date. If you edit the order of text, date, and image in Edit and then save, it will be reflected in Front News.
      </p>
      {editingId ? (
        <NewsEditForm
          docId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null)
            void load()
          }}
        />
      ) : null}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No news posts found.</p>
      ) : (
        <ul className="flex min-w-0 list-none flex-col gap-2 p-0">
          {items.map((row) => (
            <li key={row._id} className="min-w-0">
              <ListRow
                title={row.title ?? '(Untitled)'}
                subtitle={row.publishedAt ? row.publishedAt.slice(0, 10) : ''}
                onEdit={() => setEditingId(row._id)}
                onDelete={() => void onDelete(row._id, row.title ?? '(Untitled)')}
              />
            </li>
          ))}
        </ul>
      )}
      {err ? (
        <p className="whitespace-pre-wrap break-words text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void load()}
        className="text-sm text-foreground/80 underline-offset-4 hover:underline"
      >
        Refresh list
      </button>
    </div>
  )
}
