/** sessionStorage — XSS 시 노출될 수 있으므로 신뢰할 수 있는 환경에서만 사용하세요. */
export const ADMIN_SECRET_STORAGE_KEY = 'portfolio_admin_secret'

const SESSION_HEADER = 'x-admin-secret'

export function adminApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const origin = (import.meta.env.VITE_ADMIN_API_ORIGIN ?? '').replace(/\/$/, '')
  if (origin) return `${origin}${normalized}`
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
  return `${base}${normalized}`
}

export async function adminAuth(secret: string): Promise<{ok: boolean; error?: string}> {
  const res = await fetch(adminApiUrl('/api/admin/auth'), {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({secret}),
  })
  let data: {ok?: boolean; error?: string} = {}
  try {
    data = (await res.json()) as {ok?: boolean; error?: string}
  } catch {
    return {ok: false, error: '서버 응답을 읽을 수 없습니다.'}
  }
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
  const res = await fetch(adminApiUrl(path), {
    method: 'GET',
    headers: {[SESSION_HEADER]: secret},
  })
  let data: T & {ok?: boolean; error?: string} = {} as T & {ok?: boolean; error?: string}
  try {
    data = (await res.json()) as T & {ok?: boolean; error?: string}
  } catch {
    return {ok: false, error: '서버 응답을 읽을 수 없습니다.'}
  }
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  return {ok: true, data}
}

export async function adminPostJson(
  path: string,
  body: unknown,
): Promise<{ok: boolean; error?: string}> {
  const secret = getStoredAdminSecret()
  if (!secret) return {ok: false, error: '시크릿으로 먼저 로그인하세요.'}
  const res = await fetch(adminApiUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      [SESSION_HEADER]: secret,
    },
    body: JSON.stringify(body),
  })
  let data: {ok?: boolean; error?: string} = {}
  try {
    data = (await res.json()) as {ok?: boolean; error?: string}
  } catch {
    return {ok: false, error: '서버 응답을 읽을 수 없습니다.'}
  }
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  return {ok: !!data.ok}
}

export async function adminPostMultipart(
  path: string,
  form: FormData,
): Promise<{ok: boolean; error?: string; id?: string}> {
  const secret = getStoredAdminSecret()
  if (!secret) return {ok: false, error: '시크릿으로 먼저 로그인하세요.'}
  const res = await fetch(adminApiUrl(path), {
    method: 'POST',
    headers: {[SESSION_HEADER]: secret},
    body: form,
  })
  let data: {ok?: boolean; error?: string; id?: string} = {}
  try {
    data = (await res.json()) as {ok?: boolean; error?: string; id?: string}
  } catch {
    return {ok: false, error: '서버 응답을 읽을 수 없습니다.'}
  }
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  return {ok: !!data.ok, id: typeof data.id === 'string' ? data.id : undefined}
}
