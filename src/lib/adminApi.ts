/** sessionStorage — XSS 시 노출될 수 있으므로 신뢰할 수 있는 환경에서만 사용하세요. */
export const ADMIN_SECRET_STORAGE_KEY = 'portfolio_admin_secret'

const SESSION_HEADER = 'x-admin-secret'

/** 크로스 오리진 관리 API 호출 시 쿠키 미전송(브라우저 기본과 동일) — CORS `*` 조합과 맞춤 */
const adminFetchDefaults = {credentials: 'omit' as const, mode: 'cors' as const}

/** JSON이 아닐 때(정적 호스팅 404·index.html 등) 로그인 실패 원인 안내 */
const ADMIN_NON_JSON_HINT =
  '응답이 JSON이 아닙니다. GitHub Pages처럼 정적 배포만 하면 `/api/admin` 서버가 없어 이렇게 됩니다. ' +
  '관리 화면은 로컬에서 `npm run dev`로 쓰거나, Vercel·Railway 등에 관리 API를 올린 뒤 빌드 시 `VITE_ADMIN_API_ORIGIN`(예: `https://내-api.example.com`)을 설정하세요.'

function adminFetchFailedMessage(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err)
  if (/failed to fetch|load failed|networkerror|network error/i.test(msg)) {
    return (
      '이 기기에서 관리 API로 요청이 나가지 않았습니다(네트워크 차단·CORS·광고 차단·회사/공용 Wi‑Fi 등). ' +
      '휴대폰이면 데이터/Wi‑Fi를 바꿔 보고, 배포 시 넣은 `VITE_ADMIN_API_ORIGIN`(예: Vercel 주소)을 이 기기 브라우저에서 직접 열어 JSON이 오는지 확인하세요. ' +
      '또한 로그인 상태는 `sessionStorage`에만 있어 PC마다 `/admin`에서 시크릿으로 다시 로그인해야 합니다.'
    )
  }
  return `요청 실패: ${msg}`
}

export function adminApiUrl(path: string): string {
  const normalized = path.startsWith('/') ? path : `/${path}`
  const origin = (import.meta.env.VITE_ADMIN_API_ORIGIN ?? '').replace(/\/$/, '')
  if (origin) return `${origin}${normalized}`
  const base = (import.meta.env.BASE_URL ?? '/').replace(/\/$/, '')
  return `${base}${normalized}`
}

export async function adminAuth(secret: string): Promise<{ok: boolean; error?: string}> {
  let res: Response
  try {
    res = await fetch(adminApiUrl('/api/admin/auth'), {
      ...adminFetchDefaults,
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({secret}),
    })
  } catch (e) {
    return {ok: false, error: adminFetchFailedMessage(e)}
  }
  let data: {ok?: boolean; error?: string} = {}
  try {
    data = (await res.json()) as {ok?: boolean; error?: string}
  } catch {
    return {ok: false, error: ADMIN_NON_JSON_HINT}
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
  let res: Response
  try {
    res = await fetch(adminApiUrl(path), {
      ...adminFetchDefaults,
      method: 'GET',
      headers: {[SESSION_HEADER]: secret},
    })
  } catch (e) {
    return {ok: false, error: adminFetchFailedMessage(e)}
  }
  let data: T & {ok?: boolean; error?: string} = {} as T & {ok?: boolean; error?: string}
  try {
    data = (await res.json()) as T & {ok?: boolean; error?: string}
  } catch {
    return {ok: false, error: ADMIN_NON_JSON_HINT}
  }
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
  let res: Response
  try {
    res = await fetch(adminApiUrl(path), {
      ...adminFetchDefaults,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [SESSION_HEADER]: secret,
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    return {ok: false, error: adminFetchFailedMessage(e)}
  }
  let data = {} as T & {ok?: boolean; error?: string}
  try {
    data = (await res.json()) as T & {ok?: boolean; error?: string}
  } catch {
    return {ok: false, error: ADMIN_NON_JSON_HINT}
  }
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
  let res: Response
  try {
    res = await fetch(adminApiUrl(path), {
      ...adminFetchDefaults,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        [SESSION_HEADER]: secret,
      },
      body: JSON.stringify(body),
    })
  } catch (e) {
    return {ok: false, error: adminFetchFailedMessage(e)}
  }
  let data: {ok?: boolean; error?: string} = {}
  try {
    data = (await res.json()) as {ok?: boolean; error?: string}
  } catch {
    return {ok: false, error: ADMIN_NON_JSON_HINT}
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
  let res: Response
  try {
    res = await fetch(adminApiUrl(path), {
      ...adminFetchDefaults,
      method: 'POST',
      headers: {[SESSION_HEADER]: secret},
      body: form,
    })
  } catch (e) {
    return {ok: false, error: adminFetchFailedMessage(e)}
  }
  let data: {ok?: boolean; error?: string; id?: string} = {}
  try {
    data = (await res.json()) as {ok?: boolean; error?: string; id?: string}
  } catch {
    return {ok: false, error: ADMIN_NON_JSON_HINT}
  }
  if (!res.ok) return {ok: false, error: data.error ?? `HTTP ${res.status}`}
  return {ok: !!data.ok, id: typeof data.id === 'string' ? data.id : undefined}
}
