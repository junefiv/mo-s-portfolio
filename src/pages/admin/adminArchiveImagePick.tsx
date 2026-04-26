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

/**
 * 파일 선택: `button`+`ref.click()`+`sr-only` 조합은 일부 환경에서 무시될 수 있어,
 * 라벨 영역을 덮는 투명 `input[type=file]`로 직접 탭합니다.
 */
export function AddImageButton({
  inputId,
  onFiles,
  label = '이미지 추가',
}: {
  inputId: string
  onFiles: (files: FileList | null) => void
  label?: string
}) {
  return (
    <label
      className="relative flex h-16 w-16 shrink-0 cursor-pointer items-center justify-center rounded-md border-2 border-dashed border-primary/55 bg-muted/25 text-2xl font-light leading-none text-primary shadow-sm transition-colors hover:border-primary hover:bg-primary/10 hover:text-primary"
      title={label}
    >
      <input
        id={inputId}
        type="file"
        accept="image/*"
        multiple
        className="absolute inset-0 z-0 h-full w-full min-h-0 min-w-0 cursor-pointer opacity-0"
        aria-label={label}
        onChange={(e) => {
          onFiles(e.target.files)
          e.target.value = ''
        }}
      />
      <span className="pointer-events-none relative z-10 select-none" aria-hidden>
        +
      </span>
    </label>
  )
}

export function PendingImageThumb({
  url,
  onRemove,
  caption,
  fileName,
}: {
  url: string
  onRemove: () => void
  caption: string
  fileName?: string
}) {
  return (
    <div
      title={fileName ? `저장 전 · ${fileName}` : '저장 전에만 있는 미리보기'}
      className="relative h-16 w-16 shrink-0 overflow-hidden rounded-md border-2 border-dashed border-amber-500/70 bg-amber-50/30 ring-2 ring-amber-400/50 dark:bg-amber-950/25 dark:ring-amber-500/40"
    >
      <img src={url} alt="" className="h-full w-full object-cover" />
      <button
        type="button"
        onClick={onRemove}
        className="absolute -right-1 -top-1 z-20 flex h-6 w-6 items-center justify-center rounded-full bg-foreground/90 text-[11px] font-bold leading-none text-background shadow-md ring-2 ring-background hover:bg-foreground"
        aria-label={`${caption} 추가 취소`}
        title="추가 취소"
      >
        ×
      </button>
      <span className="pointer-events-none absolute inset-x-0 bottom-0 z-10 bg-amber-600/95 py-0.5 text-center text-[9px] font-semibold text-amber-50">
        저장 전
      </span>
    </div>
  )
}
