import {useRef} from 'react'

export type PendingSlot = {id: string; file: File; url: string}

export function newPendingFromFileList(files: FileList | null): PendingSlot[] {
  if (!files?.length) return []
  return Array.from(files, (file) => ({
    id:
      typeof crypto !== 'undefined' && 'randomUUID' in crypto
        ? crypto.randomUUID()
        : `${Date.now()}-${Math.random()}`,
    file,
    url: URL.createObjectURL(file),
  }))
}

export function AddImageButton({
  inputId,
  onFiles,
  label = '이미지 추가',
}: {
  inputId: string
  onFiles: (files: FileList | null) => void
  label?: string
}) {
  const inputRef = useRef<HTMLInputElement>(null)
  return (
    <>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="sr-only"
        tabIndex={-1}
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <button
        type="button"
        onClick={() => inputRef.current?.click()}
        className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-muted/30 text-2xl font-light leading-none text-muted-foreground transition-colors hover:border-primary/50 hover:bg-muted/60 hover:text-foreground"
        aria-label={label}
        title={label}
      >
        <span aria-hidden>+</span>
      </button>
    </>
  )
}

export function PendingImageThumb({
  url,
  onRemove,
  caption,
}: {
  url: string
  onRemove: () => void
  caption: string
}) {
  return (
    <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border border-dashed border-primary/35 ring-1 ring-primary/15">
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/85 text-[11px] font-bold leading-none text-background shadow-md ring-2 ring-background hover:bg-foreground"
        aria-label={`${caption} 추가 취소`}
        title="추가 취소"
      >
        ×
      </button>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 bg-primary/85 py-0.5 text-center text-[9px] font-medium text-primary-foreground">
        추가 예정
      </span>
    </div>
  )
}
