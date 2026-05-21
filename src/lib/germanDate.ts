/** Display: DD.MM.YYYY (German), always zero-padded day/month when complete. Storage: YYYY-MM-DD. */

export function isoToGermanDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso.trim())
  if (!m) return ''
  return `${m[3]}.${m[2]}.${m[1]}`
}

export function maskGermanDateInput(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8)
  if (digits.length <= 2) return digits
  if (digits.length <= 4) return `${digits.slice(0, 2)}.${digits.slice(2)}`
  return `${digits.slice(0, 2)}.${digits.slice(2, 4)}.${digits.slice(4)}`
}

/** Pad day/month to two digits when year segment is complete (8 digits total). */
export function finalizeGermanDate(display: string): string {
  const trimmed = display.trim()
  const digits = trimmed.replace(/\D/g, '')
  if (digits.length === 8) {
    const day = digits.slice(0, 2).padStart(2, '0')
    const month = digits.slice(2, 4).padStart(2, '0')
    const year = digits.slice(4, 8)
    return `${day}.${month}.${year}`
  }
  const parts = trimmed.split('.')
  if (parts.length === 3 && parts[2].length === 4) {
    return `${parts[0].padStart(2, '0')}.${parts[1].padStart(2, '0')}.${parts[2]}`
  }
  return trimmed
}

export function germanDateToIso(display: string): string | null {
  const normalized = finalizeGermanDate(display)
  const m = /^(\d{2})\.(\d{2})\.(\d{4})$/.exec(normalized)
  if (!m) return null
  const day = Number(m[1])
  const month = Number(m[2])
  const year = Number(m[3])
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const dt = new Date(year, month - 1, day)
  if (dt.getFullYear() !== year || dt.getMonth() + 1 !== month || dt.getDate() !== day) {
    return null
  }
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}
