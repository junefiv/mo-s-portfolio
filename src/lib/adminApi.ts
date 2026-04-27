/** sessionStorage — XSS 시 노출될 수 있으므로 신뢰할 수 있는 환경에서만 사용하세요. */
export const ADMIN_SECRET_STORAGE_KEY = 'portfolio_admin_secret'

const SESSION_HEADER = 'x-admin-secret'

/** 크로스 오리진 관리 API 호출 시 쿠키 미전송(브라우저 기본과 동일) — CORS `*` 조합과 맞춤 */
const adminFetchDefaults = {credentials: 'omit' as const, mode: 'cors' as const}

const BODY_PREVIEW_LEN = 480

function trimBodyPreview(s: string): string {
  const t = s.replace(/\s+/g, ' ').trim()
  if (t.length <= BODY_PREVIEW_LEN) return t
  return `${t.slice(0, BODY_PREVIEW_LEN)}…`
}

function isLikelyMixedContentBlocked(requestUrl: string): boolean {
  if (typeof window === 'undefined' || window.location?.protocol !== 'https:') return false
  try {
    return new URL(requestUrl, window.location.href).protocol === 'http:'
  } catch {
    return /^http:\/\//i.test(requestUrl)
  }
}

/**
 * `fetch`가 throw 될 때. HTTP 응답이 없는 경우 — 예외 이름·메시지·오프라인·혼합 콘텐츠는 구분 가능.
 * (CORS 실패는 대부분 동일한 TypeError로만 드러나는 것이 브라우저 제약.)
 */
function formatAdminFetchRejection(
  err: unknown,
  ctx: { method: string; url: string },
): string {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('[admin API] fetch throw', { ...ctx, err })
  }
  const e = err instanceof Error ? err : new Error(String(err))
  const { name, message: msg } = e
  if (name === 'AbortError' || (e as DOMException)?.name === 'AbortError') {
    return (
      `[요청 취소(AbortError)] ${ctx.method} ${ctx.url}\n` +
      '탐색 취소·Timeout 래퍼·AbortController로 중단된 경우가 많습니다.'
    )
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return (
      `[오프라인] ${ctx.method} ${ctx.url}\n` +
      'navigator.onLine === false — 연결·비행기 모드·끊김·VPN을 확인하세요.\n' +
      `원문: ${name}: ${msg}`
    )
  }
  const mixed = isLikelyMixedContentBlocked(ctx.url)
  const cause = (e as Error & {cause?: unknown}).cause
  const causeLine =
    cause instanceof Error
      ? `중첩 원인: ${cause.name}: ${cause.message}`
      : cause != null
        ? `중첩 원인: ${String(cause)}`
        : null
  const lines: string[] = [
    `[fetch 예외 — 응답 수신 전] ${ctx.method} ${ctx.url}`,
    `이름: ${name}`,
    `메시지: ${msg}`,
  ]
  if (mixed) {
    lines.push(
      '혼합 콘텐츠: 이 페이지는 HTTPS인데 API URL이 http:// 입니다. 브라우저가 요청을 막는 경우가 많습니다. API를 https://로 두세요.',
    )
  }
  if (causeLine) lines.push(causeLine)
  lines.push(
    '「Failed to fetch」류는 DNS·SSL·망·방화벽·CORS(실패 시 JS에 원인이 안 보이는 경우)에 공통될 수 있습니다. DevTools → Network(실패 항목)·Console을 보세요. `VITE_ADMIN_API_ORIGIN`을 쓰는 경우 이 기기에서 그 URL로 GET이 JSON을 주는지 확인하세요. sessionStorage라 기기마다 /admin에서 시크릿을 다시 입력해야 합니다.',
  )
  return lines.join('\n')
}

function formatAdminNonJsonResponse(res: Response, bodyText: string, requestUrl: string): string {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.error('[admin API] non-JSON or parse error', {
      requestUrl,
      status: res.status,
      contentType: res.headers.get('content-type'),
    })
  }
  const ct = res.headers.get('content-type') ?? '(없음)'
  const preview = trimBodyPreview(bodyText)
  const looksHtml = /^\s*<!DOCTYPE html|<html/i.test(bodyText) || /text\/html/i.test(ct)
  const hint = looksHtml
    ? 'HTML 응답: 정적 호스트(SPA 404)로 index.html이 오거나, API가 아닌 주소로 갔을 수 있습니다. `VITE_ADMIN_API_ORIGIN`이 비어 있으면 Pages 오리진으로만 요청이 갑니다.'
    : 'JSON 파싱 실패: 잘못된 경로·프록시 HTML·빈 응답·서버 오류 본문일 수 있습니다. 위 status·Content-Type·미리보기로 구분하세요.'
  return (
    `[HTTP ${res.status} ${res.statusText}] ${requestUrl}\n` +
    `Content-Type: ${ct}\n` +
    (preview ? `본문 앞 ${BODY_PREVIEW_LEN}자: ${preview}\n` : '본문: (빈 문자열)\n') +
    hint
  )
}

/** 응답 body를 text로 읽은 뒤 JSON 파싱. 실패 시 status·Content-Type·본문 미리보기 포함. */
async function parseAdminJsonResponse<T>(res: Response, requestUrl: string): Promise<{ ok: true; data: T } | { ok: false; error: string }> {
  const text = await res.text()
  if (!text.trim()) {
    if (!res.ok) {
      return { ok: false, error: formatAdminNonJsonResponse(res, text, requestUrl) }
    }
    return {
      ok: false,
      error:
        formatAdminNonJsonResponse(res, text, requestUrl) +
        '\n빈 본문 200/204는 관리 API에서 예상 밖일 수 있습니다.',
    }
  }
  try {
    return { ok: true, data: JSON.parse(text) as T }
  } catch {
    return { ok: false, error: formatAdminNonJsonResponse(res, text, requestUrl) }
  }
}

export function adminApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const origin = (import.meta.env.VITE_ADMIN_API_ORIGIN ?? '').replace(/\/$/, '')
  if (origin) return `${origin}${normalized}`
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
  return `${base}${normalized}`
}

export async function adminAuth(secret: string): Promise<{ok: boolean; error?: string}> {
  const url = adminApiUrl('/api/admin/auth')
  let res: Response
  try {
    res = await fetch(url, {
      ...adminFetchDefaults,
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({secret}),
    })
  } catch (e) {
    return {ok: false, error: formatAdminFetchRejection(e, {method: 'POST', url})}
  }
  const parsed = await parseAdminJsonResponse<{ok?: boolean; error?: string}>(res, url)
  if (!parsed.ok) return {ok: false, error: parsed.error}
  const data = parsed.data
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  return {ok: !!data.ok}
}

export function getStoredAdminSecret(): string | null {
  try {
    return sessionStorage.getItem(ADMIN_SECRET_STORAGE_KEY)
  } catch {
    return null
  }
}

export function setStoredAdminSecret(secret: string) {
  sessionStorage.setItem(ADMIN_SECRET_STORAGE_KEY, secret)
}

export function clearStoredAdminSecret() {
  sessionStorage.removeItem(ADMIN_SECRET_STORAGE_KEY)
}

export async function adminGetJson<T extends Record<string, unknown>>(
  path: string,
): Promise<{ok: boolean; data?: T; error?: string}> {
  const secret = getStoredAdminSecret()
  if (!secret) return {ok: false, error: '시크릿으로 먼저 로그인하세요.'}
  const url = adminApiUrl(path)
  let res: Response
  try {
    res = await fetch(url, {
      ...adminFetchDefaults,
      method: 'GET',
      headers: {[SESSION_HEADER]: secret},
    })
  } catch (e) {
    return {ok: false, error: formatAdminFetchRejection(e, {method: 'GET', url})}
  }
  const parsed = await parseAdminJsonResponse<T & {ok?: boolean; error?: string}>(res, url)
  if (!parsed.ok) return {ok: false, error: parsed.error}
  const data = parsed.data
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  return {ok: true, data}
}

/** POST 후 JSON 전체를 data 로 돌려줄 때(예: work-fetch 응답의 doc) */
export async function adminPostJsonData<T extends Record<string, unknown>>(
  path: string,
  body: unknown,
): Promise<{ok: boolean; data?: T; error?: string}> {
  const secret = getStoredAdminSecret()
  if (!secret) return {ok: false, error: '시크릿으로 먼저 로그인하세요.'}
  const url = adminApiUrl(path)
  let res: Response
  try {
    res = await fetch(url, {
      ...adminFetchDefaults,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [SESSION_HEADER]: secret,
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    return {ok: false, error: formatAdminFetchRejection(e, {method: 'POST', url})}
  }
  const parsed = await parseAdminJsonResponse<T & {ok?: boolean; error?: string}>(res, url)
  if (!parsed.ok) return {ok: false, error: parsed.error}
  const data = parsed.data
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  if (data.ok !== true) return {ok: false, error: data.error ?? '요청 실패'}
  return {ok: true, data}
}

export async function adminPostJson(
  path: string,
  body: unknown,
): Promise<{ok: boolean; error?: string}> {
  const secret = getStoredAdminSecret()
  if (!secret) return {ok: false, error: '시크릿으로 먼저 로그인하세요.'}
  const url = adminApiUrl(path)
  let res: Response
  try {
    res = await fetch(url, {
      ...adminFetchDefaults,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [SESSION_HEADER]: secret,
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    return {ok: false, error: formatAdminFetchRejection(e, {method: 'POST', url})}
  }
  const parsed = await parseAdminJsonResponse<{ok?: boolean; error?: string}>(res, url)
  if (!parsed.ok) return {ok: false, error: parsed.error}
  const data = parsed.data
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  return {ok: !!data.ok}
}

export async function adminPostMultipart(
  path: string,
  form: FormData,
): Promise<{ok: boolean; error?: string; id?: string}> {
  const secret = getStoredAdminSecret()
  if (!secret) return {ok: false, error: '시크릿으로 먼저 로그인하세요.'}
  const url = adminApiUrl(path)
  let res: Response
  try {
    res = await fetch(url, {
      ...adminFetchDefaults,
      method: 'POST',
      headers: {[SESSION_HEADER]: secret},
      body: form,
    })
  } catch (e) {
    return {ok: false, error: formatAdminFetchRejection(e, {method: 'POST', url})}
  }
  const parsed = await parseAdminJsonResponse<{ok?: boolean; error?: string; id?: string}>(res, url)
  if (!parsed.ok) return {ok: false, error: parsed.error}
  const data = parsed.data
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  return {ok: !!data.ok, id: typeof data.id === 'string' ? data.id : undefined}
}
