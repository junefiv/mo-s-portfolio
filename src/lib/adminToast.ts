export const ADMIN_TOAST_EVENT = 'admin:toast' as const

export type AdminToastVariant = 'success' | 'error'

export type AdminToastDetail = {
  message: string
  variant?: AdminToastVariant
}

/** `/admin` 전역 토스트 — `AdminToastListener`가 마운트된 페이지에서만 보입니다. */
export function showAdminToast(message: string, variant: AdminToastVariant = 'success') {
  if (typeof window === 'undefined') return
  const ev = new CustomEvent(ADMIN_TOAST_EVENT, {detail: {message, variant} satisfies AdminToastDetail})
  window.dispatchEvent(ev)
}
