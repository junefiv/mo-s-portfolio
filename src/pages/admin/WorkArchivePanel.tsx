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
import {startTransition, useCallback, useEffect, useState} from 'react'
import {adminGetJson, adminPostJson} from '../../lib/adminApi'

type Row = {_id: string; title: string | null; projectNo: number | null}

function SortRow({id, title}: {id: string; title: string}) {
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
      className="flex min-w-0 items-center gap-3 rounded-md border border-border bg-card px-3 py-2.5 text-sm"
    >
      <button
        type="button"
        className="touch-none cursor-grab rounded p-1 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
        aria-label="끌어서 순서 변경"
        {...attributes}
        {...listeners}
      >
        <span aria-hidden>⋮⋮</span>
      </button>
      <span className="min-w-0 flex-1 truncate font-medium text-foreground">{title}</span>
    </div>
  )
}

export default function WorkArchivePanel() {
  const [items, setItems] = useState<Row[]>([])
  const [msg, setMsg] = useState<string | null>(null)
  const [err, setErr] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = useCallback(async () => {
    setLoading(true)
    setErr(null)
    const r = await adminGetJson<{ok: boolean; items: Row[]}>('/api/admin/work-list')
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
    const save = await adminPostJson('/api/admin/work-reorder', {
      ids: next.map((x) => x._id),
    })
    if (!save.ok) {
      setErr(save.error ?? '순서 저장 실패')
      setItems(prev)
    } else {
      setMsg('순서를 저장했습니다.')
    }
  }

  if (loading) return <p className="text-sm text-muted-foreground">목록 불러오는 중…</p>

  return (
    <div className="mx-auto max-w-xl space-y-4">
      <p className="text-sm leading-relaxed text-foreground/75">
        위에서부터 사이트 WORK 페이지에 먼저 노출됩니다. 왼쪽 핸들을 끌어 순서를 바꾸면 곧바로 저장됩니다.
      </p>
      {items.length === 0 ? (
        <p className="text-sm text-muted-foreground">등록된 Work 프로젝트가 없습니다.</p>
      ) : (
        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
          <SortableContext items={items.map((i) => i._id)} strategy={verticalListSortingStrategy}>
            <ul className="flex min-w-0 list-none flex-col gap-2 p-0">
              {items.map((row) => (
                <li key={row._id} className="min-w-0">
                  <SortRow id={row._id} title={row.title ?? '(제목 없음)'} />
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
