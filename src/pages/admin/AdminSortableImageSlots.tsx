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
  rectSortingStrategy,
  sortableKeyboardCoordinates,
  useSortable,
} from '@dnd-kit/sortable'
import {CSS} from '@dnd-kit/utilities'
import {useId, type Dispatch, type SetStateAction} from 'react'
import {
  AddImageButton,
  newPendingFromFileList,
  PendingImageThumb,
  type PendingSlot,
} from './adminArchiveImagePick'

export type AdminImgSlotRow =
  | {kind: 'existing'; id: string; origIndex: number; url: string}
  | {kind: 'pending'; id: string; pending: PendingSlot}

export function slotsFromWorkSide(
  slots: Array<{url: string | null} | null> | null,
): AdminImgSlotRow[] {
  const out: AdminImgSlotRow[] = []
  ;(slots ?? []).forEach((slot, i) => {
    const url = slot?.url
    if (!url) return
    out.push({kind: 'existing', id: `e-${i}`, origIndex: i, url})
  })
  return out
}

export function slotsFromUrlList(images: (string | null)[] | null): AdminImgSlotRow[] {
  const out: AdminImgSlotRow[] = []
  ;(images ?? []).forEach((url, i) => {
    if (!url) return
    out.push({kind: 'existing', id: `e-${i}`, origIndex: i, url})
  })
  return out
}

/** Sanity `images[]` 순서와 업로드 파일 순서를 서버 `*_slots` JSON과 맞춤 */
export function serializeSlotsForMultipart(
  slots: AdminImgSlotRow[],
  rmExisting: Set<number>,
): {json: string; files: File[]} {
  const body: Array<{t: 'e'; i: number} | {t: 'p'; n: number}> = []
  const files: File[] = []
  for (const s of slots) {
    if (s.kind === 'existing') {
      if (rmExisting.has(s.origIndex)) continue
      body.push({t: 'e', i: s.origIndex})
    } else {
      body.push({t: 'p', n: files.length})
      files.push(s.pending.file)
    }
  }
  return {json: JSON.stringify(body), files}
}

function SortableThumb({
  slot,
  rmMarked,
  onToggleRemove,
  onRemovePending,
  sideLabel,
}: {
  slot: AdminImgSlotRow
  rmMarked: boolean
  onToggleRemove: (origIndex: number) => void
  onRemovePending: (id: string) => void
  sideLabel: string
}) {
  const {attributes, listeners, setNodeRef, transform, transition, isDragging} = useSortable({
    id: slot.id,
  })
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.75 : 1,
  }

  if (slot.kind === 'pending') {
    return (
      <div
        ref={setNodeRef}
        style={style}
        className="flex shrink-0 items-start gap-1 rounded-md border border-dashed border-border/80 bg-muted/20 p-1"
      >
        <button
          type="button"
          className="touch-none mt-1 shrink-0 cursor-grab rounded px-0.5 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
          aria-label="드래그하여 순서 변경"
          {...attributes}
          {...listeners}
        >
          <span aria-hidden className="text-xs leading-none">
            ⋮⋮
          </span>
        </button>
        <PendingImageThumb
          url={slot.pending.url}
          caption={sideLabel}
          fileName={slot.pending.file.name}
          onRemove={() => onRemovePending(slot.id)}
        />
      </div>
    )
  }

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex shrink-0 items-start gap-1 rounded-md border p-1 ${
        rmMarked ? 'border-destructive/60 bg-destructive/5' : 'border-border/80 bg-transparent'
      }`}
    >
      <button
        type="button"
        className="touch-none mt-1 shrink-0 cursor-grab rounded px-0.5 text-muted-foreground hover:bg-muted hover:text-foreground active:cursor-grabbing"
        aria-label="드래그하여 순서 변경"
        {...attributes}
        {...listeners}
      >
        <span aria-hidden className="text-xs leading-none">
          ⋮⋮
        </span>
      </button>
      <div
        className={`relative h-16 w-16 shrink-0 overflow-hidden rounded-md border ${
          rmMarked ? 'border-destructive opacity-55 ring-2 ring-destructive/40' : 'border-border'
        }`}
      >
        <img src={slot.url} alt="" className="h-full w-full object-cover" />
        <button
          type="button"
          onClick={() => onToggleRemove(slot.origIndex)}
          className="absolute -right-1 -top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-destructive text-[11px] font-bold leading-none text-destructive-foreground shadow-md ring-2 ring-background hover:bg-destructive/90"
          aria-label={rmMarked ? `${sideLabel} 삭제 취소` : `${sideLabel} 이미지 제거`}
          title={rmMarked ? '취소' : '제거'}
        >
          ×
        </button>
        {rmMarked ? (
          <span className="absolute inset-x-0 bottom-0 z-10 bg-destructive/90 py-0.5 text-center text-[9px] font-medium text-destructive-foreground">
            Removed
          </span>
        ) : null}
      </div>
    </div>
  )
}

export function AdminSortableImageSlotStrip({
  slots,
  setSlots,
  rmExisting,
  onToggleExistingRemove,
  pickInputId,
  addLabel,
  onToast,
  sideLabel,
}: {
  slots: AdminImgSlotRow[]
  setSlots: Dispatch<SetStateAction<AdminImgSlotRow[]>>
  rmExisting: Set<number>
  onToggleExistingRemove: (origIndex: number) => void
  pickInputId: string
  addLabel: string
  onToast: (message: string) => void
  sideLabel: string
}) {
  const dndId = useId()
  const sensors = useSensors(
    useSensor(PointerSensor, {activationConstraint: {distance: 6}}),
    useSensor(KeyboardSensor, {coordinateGetter: sortableKeyboardCoordinates}),
  )

  const onDragEnd = (event: DragEndEvent) => {
    const {active, over} = event
    if (!over || active.id === over.id) return
    setSlots((prev) => {
      const oldIndex = prev.findIndex((s) => s.id === active.id)
      const newIndex = prev.findIndex((s) => s.id === over.id)
      if (oldIndex < 0 || newIndex < 0) return prev
      return arrayMove(prev, oldIndex, newIndex)
    })
  }

  return (
    <DndContext
      id={`${dndId}-img-slots`}
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={slots.map((s) => s.id)} strategy={rectSortingStrategy}>
        <div className="flex min-w-0 flex-wrap items-start gap-2">
          {slots.map((slot) => (
            <SortableThumb
              key={slot.id}
              slot={slot}
              rmMarked={slot.kind === 'existing' && rmExisting.has(slot.origIndex)}
              onToggleRemove={onToggleExistingRemove}
              onRemovePending={(pid) => {
                setSlots((prev) => {
                  const i = prev.findIndex((x) => x.id === pid)
                  if (i < 0) return prev
                  const row = prev[i]!
                  if (row.kind === 'pending') URL.revokeObjectURL(row.pending.url)
                  return prev.filter((_, j) => j !== i)
                })
              }}
              sideLabel={sideLabel}
            />
          ))}
          <AddImageButton
            inputId={pickInputId}
            label={addLabel}
            onFiles={(files) => {
              const added = newPendingFromFileList(files)
              if (!added.length) return
              setSlots((prev) => [
                ...prev,
                ...added.map((p) => ({kind: 'pending' as const, id: `p-${p.id}`, pending: p})),
              ])
              onToast(`${added.length} image(s) selected. Click Save below to upload.`)
            }}
          />
        </div>
      </SortableContext>
    </DndContext>
  )
}
