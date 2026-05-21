import {useId, useState} from 'react'

function filesLabel(files: FileList | null, multiple: boolean): string {
  if (!files?.length) return 'No file selected'
  if (!multiple || files.length === 1) return files[0]?.name ?? 'No file selected'
  return `${files.length} files selected`
}

const chooseButtonClass =
  'inline-flex shrink-0 cursor-pointer items-center justify-center rounded border-0 bg-secondary px-3 py-1.5 text-sm font-medium text-secondary-foreground hover:opacity-90'

export function AdminFileInput({
  id: idProp,
  name,
  accept = 'image/*',
  multiple = false,
  required = false,
  className,
  inputKey,
}: {
  id?: string
  name: string
  accept?: string
  multiple?: boolean
  required?: boolean
  className?: string
  /** Parent `form.reset()` 시 state 초기화용 */
  inputKey?: number | string
}) {
  const autoId = useId()
  const id = idProp ?? autoId
  const [status, setStatus] = useState('No file selected')

  return (
    <div
      className={`flex min-w-0 flex-wrap items-center gap-3 rounded-md border border-border bg-[var(--input-background)] px-3 py-2 ${className ?? ''}`}
    >
      <label htmlFor={id} className={chooseButtonClass} lang="en">
        Choose file
      </label>
      <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground" lang="en">
        {status}
      </span>
      <input
        key={inputKey}
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        required={required}
        lang="en"
        className="sr-only"
        onChange={(e) => {
          setStatus(filesLabel(e.target.files, multiple))
        }}
      />
    </div>
  )
}
