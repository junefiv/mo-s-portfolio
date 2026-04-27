import {useEffect, useState} from 'react'
import {createPortal} from 'react-dom'
import {ADMIN_TOAST_EVENT, type AdminToastDetail, type AdminToastVariant} from '@/lib/adminToast'

export default function AdminToastListener() {
  const [toast, setToast] = useState<{message: string; variant: AdminToastVariant} | null>(null)

  useEffect(() => {
    const onToast = (ev: Event) => {
      const ce = ev as CustomEvent<AdminToastDetail>
      const d = ce.detail
      if (d?.message) {
        setToast({message: d.message, variant: d.variant ?? 'success'})
      }
    }
    window.addEventListener(ADMIN_TOAST_EVENT, onToast as EventListener)
    return () => window.removeEventListener(ADMIN_TOAST_EVENT, onToast as EventListener)
  }, [])

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => setToast(null), 4200)
    return () => window.clearTimeout(id)
  }, [toast])

  if (!toast) return null

  const err = toast.variant === 'error'

  return createPortal(
    <div
      role="status"
      aria-live="polite"
      className="pointer-events-none fixed bottom-4 left-1/2 z-[9999] max-w-[min(24rem,calc(100vw-2rem))] -translate-x-1/2 px-3 sm:bottom-6"
    >
      <div
        className={`pointer-events-auto max-h-[min(70vh,24rem)] overflow-y-auto whitespace-pre-wrap break-words rounded-lg border px-4 py-3 text-sm leading-snug shadow-lg ${
          err
            ? 'border-destructive/50 bg-destructive/90 text-destructive-foreground'
            : 'border-border bg-card text-foreground'
        }`}
      >
        {toast.message}
      </div>
    </div>,
    document.body,
  )
}
