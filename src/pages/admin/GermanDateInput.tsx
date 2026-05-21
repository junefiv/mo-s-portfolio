import {
  finalizeGermanDate,
  germanDateToIso,
  isoToGermanDate,
  maskGermanDateInput,
} from '@/lib/germanDate'
import {useCallback, useEffect, useId, useRef, useState} from 'react'

export function GermanDateInput({
  id: idProp,
  name,
  required = false,
  defaultIso = '',
  className,
}: {
  id?: string
  name: string
  required?: boolean
  /** YYYY-MM-DD */
  defaultIso?: string
  className?: string
}) {
  const autoId = useId()
  const id = idProp ?? autoId
  const textRef = useRef<HTMLInputElement>(null)
  const initialIso = defaultIso.trim()
  const validInitial = /^\d{4}-\d{2}-\d{2}$/.test(initialIso)

  const [display, setDisplay] = useState(() => isoToGermanDate(initialIso))
  const [iso, setIso] = useState(() => (validInitial ? initialIso : ''))
  const [invalid, setInvalid] = useState(false)

  const applyDisplay = useCallback((value: string) => {
    const finalized = finalizeGermanDate(value)
    const nextIso = germanDateToIso(finalized)
    setDisplay(finalized)
    setIso(nextIso ?? '')
    setInvalid(finalized.length > 0 && !nextIso)
  }, [])

  useEffect(() => {
    const el = textRef.current
    if (!el) return
    if (required && !iso) {
      el.setCustomValidity(
        invalid
          ? 'Enter a valid date as DD.MM.YYYY (e.g. 01.01.2016).'
          : 'Date is required.',
      )
    } else {
      el.setCustomValidity('')
    }
  }, [iso, required, invalid])

  return (
    <div className="min-w-0">
      <input type="hidden" name={name} value={iso} />
      <input
        ref={textRef}
        id={id}
        type="text"
        inputMode="numeric"
        autoComplete="off"
        lang="de"
        placeholder="01.01.2016"
        required={required}
        aria-invalid={invalid}
        value={display}
        onChange={(e) => {
          const masked = maskGermanDateInput(e.target.value)
          setDisplay(masked)
          const digits = masked.replace(/\D/g, '')
          if (digits.length === 8) {
            applyDisplay(masked)
          } else {
            setIso('')
            setInvalid(false)
          }
        }}
        onBlur={() => applyDisplay(display)}
        className={className}
      />
      {invalid ? (
        <p className="mt-1.5 text-xs text-destructive" role="alert">
          Enter a valid date as DD.MM.YYYY (e.g. 01.01.2016).
        </p>
      ) : null}
    </div>
  )
}
