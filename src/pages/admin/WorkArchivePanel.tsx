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
  slotsFromWorkSide,
  type AdminImgSlotRow,
} from './AdminSortableImageSlots'

type Row = {_id: string; title: string | null; projectNo: number | null}

type WorkDoc = {
  _id: string
  projectNo: number | null
  title: string | null
  subTitle: string | null
  body: string | null
  imagesLeft: Array<{url: string | null} | null> | null
  imagesRight: Array<{url: string | null} | null> | null
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

function WorkEditForm({
  docId,
  onClose,
  onSaved,
}: {
  docId: string
  onClose: () => void
  onSaved: () => void
}) {
  const formId = useId()
  const [doc, setDoc] = useState<WorkDoc | null>(null)
  const [loadErr, setLoadErr] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [rmLeft, setRmLeft] = useState<Set<number>>(() => new Set())
  const [rmRight, setRmRight] = useState<Set<number>>(() => new Set())
  const [leftSlots, setLeftSlots] = useState<AdminImgSlotRow[]>([])
  const [rightSlots, setRightSlots] = useState<AdminImgSlotRow[]>([])

  useEffect(() => {
    return () => {
      setLeftSlots((prev) => {
        prev.forEach((s) => {
          if (s.kind === 'pending') URL.revokeObjectURL(s.pending.url)
        })
        return []
      })
      setRightSlots((prev) => {
        prev.forEach((s) => {
          if (s.kind === 'pending') URL.revokeObjectURL(s.pending.url)
        })
        return []
      })
    }
  }, [])

  useEffect(() => {
    setRmLeft(new Set())
    setRmRight(new Set())
    setLeftSlots((prev) => {
      prev.forEach((s) => {
        if (s.kind === 'pending') URL.revokeObjectURL(s.pending.url)
      })
      return []
    })
    setRightSlots((prev) => {
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
      const r = await adminPostJsonData<{ok: boolean; doc?: WorkDoc; error?: string}>(
        '/api/admin/work-fetch',
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
    setLeftSlots(slotsFromWorkSide(doc.imagesLeft))
    setRightSlots(slotsFromWorkSide(doc.imagesRight))
  }, [doc])

  const clearPending = () => {
    setLeftSlots((prev) => {
      prev.forEach((s) => {
        if (s.kind === 'pending') URL.revokeObjectURL(s.pending.url)
      })
      return prev.filter((s) => s.kind === 'existing')
    })
    setRightSlots((prev) => {
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
    const subTitle = (form.elements.namedItem('sub_title') as HTMLInputElement | null)?.value ?? ''
    const body = (form.elements.namedItem('body') as HTMLTextAreaElement | null)?.value ?? ''
    const fd = new FormData()
    fd.append('_id', doc._id)
    fd.append('title', title)
    fd.append('sub_title', subTitle)
    fd.append('body', body)
    fd.append('remove_left_indexes', [...rmLeft].sort((a, b) => a - b).join(','))
    fd.append('remove_right_indexes', [...rmRight].sort((a, b) => a - b).join(','))
    const leftSer = serializeSlotsForMultipart(leftSlots, rmLeft)
    const rightSer = serializeSlotsForMultipart(rightSlots, rmRight)
    fd.append('left_slots', leftSer.json)
    fd.append('right_slots', rightSer.json)
    for (const f of leftSer.files) {
      fd.append('imagesLeft', f, f.name || 'image.jpg')
    }
    for (const f of rightSer.files) {
      fd.append('imagesRight', f, f.name || 'image.jpg')
    }
    try {
      const fdOut = await formDataWithResizedImages(fd)
      const r = await adminPostMultipart('/api/admin/work-update', fdOut)
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
        <p className="text-sm font-medium text-foreground">Edit Work</p>
        <button type="button" onClick={onClose} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          Close
        </button>
      </div>
      <Field label="Title" htmlFor={`${formId}-title`}>
        <input
          id={`${formId}-title`}
          name="title"
          required
          defaultValue={doc.title ?? ''}
          className={fieldClass}
        />
      </Field>
      <Field label="Subtitle (sub_title)" htmlFor={`${formId}-sub`}>
        <input id={`${formId}-sub`} name="sub_title" defaultValue={doc.subTitle ?? ''} className={fieldClass} />
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
        Images: ⋮⋮로 드래그해 순서를 바꿀 수 있습니다. ×는 삭제 예약(저장 시 반영), +로 새 파일을 끼워 넣을 수 있습니다. 주황 테두리는 저장 전 업로드 대기입니다. Save 후 Sanity에 반영됩니다.
      </p>
      <div className="grid min-w-0 gap-4 sm:grid-cols-2">
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium text-foreground">Drawings (left)</p>
          <AdminSortableImageSlotStrip
            slots={leftSlots}
            setSlots={setLeftSlots}
            rmExisting={rmLeft}
            onToggleExistingRemove={(origIndex) => {
              setRmLeft((prev) => {
                const n = new Set(prev)
                if (n.has(origIndex)) n.delete(origIndex)
                else n.add(origIndex)
                return n
              })
            }}
            pickInputId={`${formId}-pick-left`}
            addLabel="Add drawing images"
            onToast={(m) => showAdminToast(m, 'success')}
            sideLabel="drawing"
          />
        </div>
        <div className="min-w-0 space-y-2">
          <p className="text-xs font-medium text-foreground">Artwork (right)</p>
          <AdminSortableImageSlotStrip
            slots={rightSlots}
            setSlots={setRightSlots}
            rmExisting={rmRight}
            onToggleExistingRemove={(origIndex) => {
              setRmRight((prev) => {
                const n = new Set(prev)
                if (n.has(origIndex)) n.delete(origIndex)
                else n.add(origIndex)
                return n
              })
            }}
            pickInputId={`${formId}-pick-right`}
            addLabel="Add artwork images"
            onToast={(m) => showAdminToast(m, 'success')}
            sideLabel="artwork"
          />
        </div>
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

export default function WorkArchivePanel() {
  const [items, setItems] = useState<Row[]>([])
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const r = await adminGetJson<{ok: boolean; items: Row[]}>('/api/admin/work-list')
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
    const save = await adminPostJson('/api/admin/work-reorder', {
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
    const r = await adminPostJson('/api/admin/work-delete', {id})
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
        Items appear on the WORK page from top to bottom. Drag the handle to reorder, and use each row’s buttons to edit or delete.
      </p>
      {editingId ? (
        <WorkEditForm
          docId={editingId}
          onClose={() => setEditingId(null)}
          onSaved={() => {
            setEditingId(null)
            void load()
          }}
        />
      ) : null}
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">No Work projects found.</p>
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
