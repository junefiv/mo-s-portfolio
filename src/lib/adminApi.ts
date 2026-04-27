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
      `[Request aborted (AbortError)] ${ctx.method} ${ctx.url}\n` +
      'This is commonly caused by navigation cancellation, timeout wrappers, or AbortController.'
    )
  }
  if (typeof navigator !== 'undefined' && navigator.onLine === false) {
    return (
      `[Offline] ${ctx.method} ${ctx.url}\n` +
      'navigator.onLine === false — check network connection, airplane mode, temporary disconnects, or VPN.\n' +
      `Original: ${name}: ${msg}`
    )
  }
  const mixed = isLikelyMixedContentBlocked(ctx.url)
  const cause = (e as Error & {cause?: unknown}).cause
  const causeLine =
    cause instanceof Error
      ? `Nested cause: ${cause.name}: ${cause.message}`
      : cause != null
        ? `Nested cause: ${String(cause)}`
        : null
  const lines: string[] = [
    `[Fetch exception — before response] ${ctx.method} ${ctx.url}`,
    `Name: ${name}`,
    `Message: ${msg}`,
  ]
  if (mixed) {
    lines.push(
      'Mixed content: this page is HTTPS but the API URL is http://. Browsers often block this request. Use an https:// API URL.',
    )
  }
  if (causeLine) lines.push(causeLine)
  lines.push(
    '"Failed to fetch" can indicate DNS, SSL, network, firewall, or CORS issues (in many CORS failures, JavaScript cannot see the detailed cause). Check DevTools → Network and Console. If you use `VITE_ADMIN_API_ORIGIN`, verify this device can GET JSON from that URL. Login state is stored in sessionStorage, so each device/browser must sign in again at /admin.',
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
  const ct = res.headers.get('content-type') ?? '(none)'
  const preview = trimBodyPreview(bodyText)
  const looksHtml = /^\s*<!DOCTYPE html|<html/i.test(bodyText) || /text\/html/i.test(ct)
  const hint = looksHtml
    ? 'HTML response detected: this may be index.html from a static host (SPA 404) or a non-API URL. If `VITE_ADMIN_API_ORIGIN` is empty, requests go to the current Pages origin.'
    : 'JSON parse failed: possible causes are wrong path, proxied HTML, empty response, or server error body. Use status, Content-Type, and preview to identify the cause.'
  return (
    `[HTTP ${res.status} ${res.statusText}] ${requestUrl}\n` +
    `Content-Type: ${ct}\n` +
    (preview ? `Body preview (first ${BODY_PREVIEW_LEN} chars): ${preview}\n` : 'Body: (empty)\n') +
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
        '\nAn empty 200/204 body may be unexpected for this admin API.',
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
  if ('error' in parsed) return {ok: false, error: parsed.error}
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
  if (!secret) return {ok: false, error: 'Please sign in with the admin secret first.'}
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
  if ('error' in parsed) return {ok: false, error: parsed.error}
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
  if (!secret) return {ok: false, error: 'Please sign in with the admin secret first.'}
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
  if ('error' in parsed) return {ok: false, error: parsed.error}
  const data = parsed.data
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  if (data.ok !== true) return {ok: false, error: data.error ?? 'Request failed'}
  return {ok: true, data}
}

export async function adminPostJson(
  path: string,
  body: unknown,
): Promise<{ok: boolean; error?: string}> {
  const secret = getStoredAdminSecret()
  if (!secret) return {ok: false, error: 'Please sign in with the admin secret first.'}
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
  if ('error' in parsed) return {ok: false, error: parsed.error}
  const data = parsed.data
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  return {ok: !!data.ok}
}

export async function adminPostMultipart(
  path: string,
  form: FormData,
): Promise<{ok: boolean; error?: string; id?: string}> {
  const secret = getStoredAdminSecret()
  if (!secret) return {ok: false, error: 'Please sign in with the admin secret first.'}
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
    return {
      ok: false,
      error:
        formatAdminFetchRejection(e, {method: 'POST', url}) +
        '\n\n[multipart] Many high-resolution images can exceed request body limits or serverless execution time. Try splitting uploads into smaller batches or reducing image size/resolution.',
    }
  }
  const parsed = await parseAdminJsonResponse<{ok?: boolean; error?: string; id?: string}>(res, url)
  if ('error' in parsed) return {ok: false, error: parsed.error}
  const data = parsed.data
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  return {ok: !!data.ok, id: typeof data.id === 'string' ? data.id : undefined}
}
