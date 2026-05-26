/** 공개 페이지 fetch 실패 — API URL·토큰 등은 노출하지 않음 (검색 스니펫·보안). */
export const PUBLIC_LOAD_ERROR_MESSAGE =
  'Unable to load content right now. Please try again later.'

export function publicLoadErrorMessage(error: unknown): string {
  if (import.meta.env.DEV) {
    const detail = error instanceof Error ? error.message : String(error)
    console.error('[public load]', detail)
  }
  return PUBLIC_LOAD_ERROR_MESSAGE
}
