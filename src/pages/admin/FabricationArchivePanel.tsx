import {
  DndContext,
  type DragEndEvent,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
} from '@dnd-kit/core'
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
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

type Row = {_id: string; title: string | null; sortNo: number | null}

type FabDoc = {
  _id: string
  year: string | null
  title: string | null
  subTitle: string | null
  category: string | null
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

function SortRow({
  id,
  title,
  onEdit,
  onDelete,
}: {
  id: string
  title: string
  onEdit: () => void
  onDelete: () => void
}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({id})
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.65 : 1,
  }
  return (
    <div
      ref={setNodeRef}
      style={style}
      className="flex min-w-0 flex-wrap items-center gap-2 rounded-md border border-border bg-card px-3 py-2.5 text-sm sm:flex-nowrap sm:gap-3"
    >
      <button
        type="button"
        className="touch-none shrink-0 cursor-grab rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
        aria-label="Drag to reorder"
        {...attributes}
        {...listeners}
      >
        <span aria-hidden>⋮⋮</span>
      </button>
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{title}</span>
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

function FabricationEditForm({
  docId,
  onClose,
  onSaved,
}: {
  docId: string
  onClose: () => void
  onSaved: () => void
}) {
  const formId = useId()
  const [doc, setDoc] = useState<FabDoc | null>(null)
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
      const r = await adminPostJsonData<{ok: boolean; doc?: FabDoc; error?: string}>(
        '/api/admin/fabrication-fetch',
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
    const year = (form.elements.namedItem('year') as HTMLInputElement | null)?.value ?? ''
    const title = (form.elements.namedItem('title') as HTMLInputElement | null)?.value ?? ''
    const subTitle = (form.elements.namedItem('sub_title') as HTMLInputElement | null)?.value ?? ''
    const category = (form.elements.namedItem('category') as HTMLInputElement | null)?.value ?? ''
    const body = (form.elements.namedItem('body') as HTMLTextAreaElement | null)?.value ?? ''
    const fd = new FormData()
    fd.append('_id', doc._id)
    fd.append('year', year)
    fd.append('title', title)
    fd.append('sub_title', subTitle)
    fd.append('category', category)
    fd.append('body', body)
    fd.append('remove_image_indexes', [...rmImg].sort((a, b) => a - b).join(','))
    const ser = serializeSlotsForMultipart(imgSlots, rmImg)
    fd.append('image_slots', ser.json)
    for (const f of ser.files) {
      fd.append('images', f, f.name || 'image.jpg')
    }
    try {
      const fdOut = await formDataWithResizedImages(fd)
      const r = await adminPostMultipart('/api/admin/fabrication-update', fdOut)
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
        <p className="text-sm font-medium text-foreground">Edit Fabrication</p>
        <button type="button" onClick={onClose} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Close
        </button>
      </div>
      <Field label="Year" htmlFor={`${formId}-year`}>
        <input id={`${formId}-year`} name="year" required defaultValue={doc.year ?? ''} className={fieldClass} />
      </Field>
      <Field label="Title" htmlFor={`${formId}-title`}>
        <input id={`${formId}-title`} name="title" required defaultValue={doc.title ?? ''} className={fieldClass} />
      </Field>
      <Field label="Subtitle (sub_title)" htmlFor={`${formId}-sub`}>
        <input id={`${formId}-sub`} name="sub_title" defaultValue={doc.subTitle ?? ''} className={fieldClass} />
      </Field>
      <Field label="Category" htmlFor={`${formId}-cat`}>
        <input id={`${formId}-cat`} name="category" defaultValue={doc.category ?? ''} className={fieldClass} />
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

export default function FabricationArchivePanel() {
  const [items, setItems] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const r = await adminGetJson<{ok: boolean; items: Row[]}>('/api/admin/fabrication-list')
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

  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 6}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  )

  const onDragEnd = async (event: DragEndEvent) => {
    const {active, over} = event
    if (!over || active.id === over.id) return
    const oldIndex = items.findIndex((x) => x._id === active.id)
    const newIndex = items.findIndex((x) => x._id === over.id)
    if (oldIndex < 0 || newIndex < 0) return
    const prev = items
    const next = arrayMove(items, oldIndex, newIndex)
    setItems(next)
    setErr(null)
    const save = await adminPostJson('/api/admin/fabrication-reorder', {
      ids: next.map((x) => x._id),
    })
    if (!save.ok) {
      const why = save.error ?? 'Failed to save order.'
      setErr(why)
      showAdminToast(why, 'error')
      setItems(prev)
    } else {
      showAdminToast('Order saved.', 'success')
    }
  }

  const onDelete = async (id: string, title: string) => {
    if (!window.confirm(`Delete "${title}"? This will be permanently removed from Sanity.`)) return
    setErr(null)
    const r = await adminPostJson('/api/admin/fabrication-delete', {id})
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
        Items appear on the Fabrication page from top to bottom. Drag the handle to reorder, and use each row’s buttons to edit or delete.
      </p>
      {editingId ? (
        <FabricationEditForm
          docId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null)
            void load()
          }}
        />
      ) : null}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No Fabrication items found.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
            <ul className="flex min-w-0 list-none flex-col gap-2 p-0">
              {items.map((row) => (
                <li key={row._id} className="min-w-0">
                  <SortRow
                    id={row._id}
                    title={row.title ?? '(Untitled)'}
                    onEdit={() => setEditingId(row._id)}
                    onDelete={() => void onDelete(row._id, row.title ?? '(Untitled)')}
                  />
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
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
