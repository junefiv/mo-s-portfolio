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
const fileInputClass = `${fieldClass} py-2 file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1.5 file:text-sm file:font-medium`

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

function ImageThumbWithRemove({
  url,
  marked,
  onToggle,
}: {
  url: string
  marked: boolean
  onToggle: () => void
}) {
  return (
    <div
      className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border ${
        marked ? 'border-destructive opacity-55 ring-2 ring-destructive/40' : 'border-border'
      }`}
    >
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onToggle}
        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[11px] font-bold leading-none text-destructive-foreground shadow-md ring-2 ring-background hover:bg-destructive/90"
        aria-label={marked ? '삭제 취소' : '이미지 삭제'}
        title={marked ? '삭제 취소' : '삭제'}
      >
        ×
      </button>
      {marked ? (
        <span className="absolute inset-x-0 bottom-0 bg-destructive/90 py-0.5 text-center text-[9px] font-medium text-destructive-foreground">
          삭제됨
        </span>
      ) : null}
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
        aria-label="끌어서 순서 변경"
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
          수정
        </button>
        <button
          type="button"
          onClick={onDelete}
          className="rounded border border-destructive/50 bg-background px-2 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
        >
          삭제
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
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [fileKey, setFileKey] = useState(0)
  const [rmImg, setRmImg] = useState<Set<number>>(() => new Set())

  useEffect(() => {
    setRmImg(new Set())
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
        setLoadErr(r.error ?? '불러오기 실패')
        return
      }
      setDoc(r.data.doc)
    })()
    return () => {
      cancelled = true
    }
  }, [docId])

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!doc) return
    setMsg(null)
    setErr(null)
    const form = e.currentTarget
    const fd = new FormData(form)
    fd.set('_id', doc._id)
    fd.set('remove_image_indexes', [...rmImg].sort((a, b) => a - b).join(','))
    setBusy(true)
    try {
      const r = await adminPostMultipart('/api/admin/fabrication-update', fd)
      if (r.ok) {
        setMsg('저장했습니다.')
        onSaved()
      } else {
        setErr(r.error ?? '저장 실패')
      }
    } finally {
      setBusy(false)
    }
  }

  if (loadErr) {
    return (
      <div className="rounded-md border border-destructive/40 bg-destructive/5 p-4 text-sm text-destructive">
        {loadErr}
        <button type="button" className="ml-3 underline" onClick={onClose}>
          닫기
        </button>
      </div>
    )
  }

  if (!doc) {
    return <p className="text-sm text-muted-foreground">불러오는 중…</p>
  }

  return (
    <form
      encType="multipart/form-data"
      onSubmit={(e) => void handleSubmit(e)}
      className="space-y-4 rounded-lg border border-border bg-muted/20 p-4"
    >
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-foreground">Fabrication 수정</p>
        <button type="button" onClick={onClose} className="text-sm text-muted-foreground underline-offset-4 hover:underline">
          닫기
        </button>
      </div>
      <Field label="연도 (year)" htmlFor={`${formId}-year`}>
        <input id={`${formId}-year`} name="year" required defaultValue={doc.year ?? ''} className={fieldClass} />
      </Field>
      <Field label="제목" htmlFor={`${formId}-title`}>
        <input id={`${formId}-title`} name="title" required defaultValue={doc.title ?? ''} className={fieldClass} />
      </Field>
      <Field label="부제 (sub_title)" htmlFor={`${formId}-sub`}>
        <input id={`${formId}-sub`} name="sub_title" defaultValue={doc.subTitle ?? ''} className={fieldClass} />
      </Field>
      <Field label="카테고리" htmlFor={`${formId}-cat`}>
        <input id={`${formId}-cat`} name="category" defaultValue={doc.category ?? ''} className={fieldClass} />
      </Field>
      <Field label="본문" htmlFor={`${formId}-body`}>
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
        이미지: ×로 삭제 예약(저장 시 반영). 새 파일을 고르면 남은 이미지 뒤에 추가됩니다.
      </p>
      <div className="min-w-0 space-y-2">
        <p className="text-xs font-medium text-foreground">현재 이미지</p>
        <div className="flex flex-wrap gap-2">
          {(doc.images ?? []).map((url, i) => {
            if (!url) return null
            return (
              <ImageThumbWithRemove
                key={`I-${i}`}
                url={url}
                marked={rmImg.has(i)}
                onToggle={() => {
                  setRmImg((prev) => {
                    const n = new Set(prev)
                    if (n.has(i)) n.delete(i)
                    else n.add(i)
                    return n
                  })
                }}
              />
            )
          })}
        </div>
        <Field label="이미지 추가 (선택)" htmlFor={`${formId}-img`}>
          <input
            key={fileKey}
            id={`${formId}-img`}
            name="images"
            type="file"
            accept="image/*"
            multiple
            className={fileInputClass}
          />
        </Field>
      </div>
      <div className="flex flex-wrap gap-2">
        <button
          type="submit"
          disabled={busy}
          className="rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {busy ? '저장 중…' : '저장'}
        </button>
        <button type="button" onClick={() => setFileKey((k) => k + 1)} className="rounded-md border border-border px-3 py-2 text-sm">
          파일 선택 초기화
        </button>
      </div>
      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p> : null}
      {err ? (
        <p className="text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}
    </form>
  )
}

export default function FabricationArchivePanel() {
  const [items, setItems] = useState<Row[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const r = await adminGetJson<{ok: boolean; items: Row[]}>('/api/admin/fabrication-list')
    if (!r.ok || !r.data?.items) {
      setErr(r.error ?? '목록을 불러올 수 없습니다.')
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
    setMsg(null)
    setErr(null)
    const save = await adminPostJson('/api/admin/fabrication-reorder', {
      ids: next.map((x) => x._id),
    })
    if (!save.ok) {
      setErr(save.error ?? '순서 저장 실패')
      setItems(prev)
    } else {
      setMsg('순서를 저장했습니다.')
    }
  }

  const onDelete = async (id: string, title: string) => {
    if (!window.confirm(`「${title}」을(를) 삭제할까요? Sanity에서 완전히 지워집니다.`)) return
    setErr(null)
    setMsg(null)
    const r = await adminPostJson('/api/admin/fabrication-delete', {id})
    if (!r.ok) {
      setErr(r.error ?? '삭제 실패')
      return
    }
    if (editingId === id) setEditingId(null)
    setMsg('삭제했습니다.')
    void load()
  }

  if (loading) return <p className="text-sm text-muted-foreground">목록 불러오는 중…</p>

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <p className="text-sm leading-relaxed text-foreground/75">
        위에서부터 Fabrication 페이지에 먼저 노출됩니다. 핸들로 순서를 바꾸면 저장되고, 수정·삭제는 각 행의
        버튼을 사용하세요.
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
        <p className="text-sm text-muted-foreground">등록된 Fabrication 항목이 없습니다.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
            <ul className="flex min-w-0 list-none flex-col gap-2 p-0">
              {items.map((row) => (
                <li key={row._id} className="min-w-0">
                  <SortRow
                    id={row._id}
                    title={row.title ?? '(제목 없음)'}
                    onEdit={() => setEditingId(row._id)}
                    onDelete={() => void onDelete(row._id, row.title ?? '(제목 없음)')}
                  />
                </li>
              ))}
            </ul>
          </SortableContext>
        </DndContext>
      )}
      {msg ? <p className="text-sm text-emerald-700 dark:text-emerald-400">{msg}</p> : null}
      {err ? (
        <p className="text-sm text-destructive" role="alert">
          {err}
        </p>
      ) : null}
      <button
        type="button"
        onClick={() => void load()}
        className="text-sm text-foreground/80 underline-offset-4 hover:underline"
      >
        목록 새로고침
      </button>
    </div>
  )
}
