import {randomBytes} from 'node:crypto'
import type {IncomingMessage, ServerResponse} from 'node:http'
import {createClient, type SanityClient} from '@sanity/client'
import {loadEnv, type Plugin} from 'vite'
import multer from 'multer'

const SESSION_HEADER = 'x-admin-secret'

type AdminEnv = {
  secret: string
  token: string
  projectId: string
  dataset: string
}

/** 개발 모드에서 `PORTFOLIO_ADMIN_SECRET` 미설정 시에만 쓰는 기본값(운영 빌드에서는 사용하지 않음). */
const DEV_DEFAULT_ADMIN_SECRET = '123456'

/** Sanity Content Lake 쓰기용 API 토큰은 보통 `sk` 로 시작합니다(관리 화면 시크릿과 무관). */
function looksLikeSanityWriteToken(t: string) {
  const s = t.trim()
  return s.startsWith('sk') && s.length >= 16
}

type AdminEnvLoad =
  | {status: 'ready'; env: AdminEnv}
  | {status: 'disabled'; message: string}

function loadAdminEnv(mode: string, root: string): AdminEnvLoad {
  const env = loadEnv(mode, root, '')
  const explicit = env.PORTFOLIO_ADMIN_SECRET?.trim()
  const secret =
    explicit || (mode === 'development' ? DEV_DEFAULT_ADMIN_SECRET : '')
  const tokenRaw = (env.SANITY_API_WRITE_TOKEN ?? env.SANITY_WRITE_TOKEN ?? '').trim()
  const projectId =
    env.SANITY_STUDIO_PROJECT_ID ?? env.VITE_SANITY_PROJECT_ID ?? 'svd1v3dw'
  const dataset =
    env.SANITY_STUDIO_DATASET ?? env.VITE_SANITY_DATASET ?? 'production'

  if (!secret) {
    return {
      status: 'disabled',
      message:
        '관리 API 비활성: production 빌드에서는 .env 에 PORTFOLIO_ADMIN_SECRET 이 필요합니다.',
    }
  }
  if (!tokenRaw) {
    return {
      status: 'disabled',
      message:
        '관리 API 비활성: .env.local 등에 SANITY_API_WRITE_TOKEN 을 설정하세요. https://www.sanity.io/manage → 프로젝트 → API → Tokens → Add API token → Role: Editor',
    }
  }
  if (!looksLikeSanityWriteToken(tokenRaw)) {
    return {
      status: 'disabled',
      message:
        'SANITY_API_WRITE_TOKEN 이 Sanity API 토큰 형식이 아닙니다(sk로 시작하는 긴 문자열). /admin 로그인용 시크릿(예: 123456)과는 다른 값입니다. sanity.io/manage 에서 Editor 토큰을 새로 만드세요.',
    }
  }

  return {
    status: 'ready',
    env: {secret, token: tokenRaw, projectId, dataset},
  }
}

function formatSanityClientError(msg: string): string {
  if (/session not found|unauthorized/i.test(msg)) {
    return `${msg} — API 토큰이 잘못되었거나 만료된 경우가 많습니다. sanity.io/manage 의 Tokens에서 sk… 토큰(Editor)을 다시 발급해 SANITY_API_WRITE_TOKEN 에 넣으세요. (CLI 로그인용 SANITY_AUTH_TOKEN 과는 다릅니다.)`
  }
  return msg
}

function clientFromEnv(e: AdminEnv): SanityClient {
  return createClient({
    projectId: e.projectId,
    dataset: e.dataset,
    apiVersion: '2025-02-19',
    token: e.token,
    useCdn: false,
  })
}

function json(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Headers', `Content-Type, ${SESSION_HEADER}`)
  res.end(JSON.stringify(body))
}

function corsOptions(res: ServerResponse) {
  res.statusCode = 204
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', `Content-Type, ${SESSION_HEADER}`)
  res.setHeader('Access-Control-Max-Age', '86400')
  res.end()
}

async function readJsonBody(req: IncomingMessage): Promise<unknown> {
  const chunks: Buffer[] = []
  for await (const chunk of req) {
    chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
  }
  const raw = Buffer.concat(chunks).toString('utf8')
  if (!raw.trim()) return null
  try {
    return JSON.parse(raw) as unknown
  } catch {
    return null
  }
}

function getHeaderSecret(req: IncomingMessage, body?: Record<string, unknown>): string {
  const h = req.headers[SESSION_HEADER]
  const fromHeader = Array.isArray(h) ? h[0] : h
  if (fromHeader && typeof fromHeader === 'string') return fromHeader.trim()
  const fromBody = body?.secret
  if (typeof fromBody === 'string') return fromBody.trim()
  return ''
}

function verifySecret(req: IncomingMessage, env: AdminEnv, body?: Record<string, unknown>) {
  return getHeaderSecret(req, body) === env.secret
}

function makeSlug(title: string) {
  const ascii = title
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .slice(0, 48)
  const tail = randomBytes(4).toString('hex')
  const base = ascii || 'doc'
  return `${base}-${tail}`.slice(0, 90)
}

function arrayKey() {
  return randomBytes(6).toString('base64url').replace(/=/g, '')
}

type UploadedFile = {buffer: Buffer; originalname?: string; mimetype?: string}

async function uploadImages(
  client: SanityClient,
  files: UploadedFile[] | undefined,
): Promise<Array<{_type: 'image'; _key: string; asset: {_type: 'reference'; _ref: string}}>> {
  if (!files?.length) return []
  const out: Array<{_type: 'image'; _key: string; asset: {_type: 'reference'; _ref: string}}> =
    []
  for (const file of files) {
    const asset = await client.assets.upload('image', file.buffer, {
      filename: file.originalname || 'upload.jpg',
      contentType: file.mimetype || 'image/jpeg',
    })
    out.push({
      _type: 'image',
      _key: arrayKey(),
      asset: {_type: 'reference', _ref: asset._id},
    })
  }
  return out
}

function firstField(body: Record<string, unknown>, key: string): string {
  const v = body[key]
  if (typeof v === 'string') return v.trim()
  if (Array.isArray(v) && typeof v[0] === 'string') return v[0].trim()
  return ''
}

function runMulter(
  req: IncomingMessage,
  res: ServerResponse,
  mw: (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void,
) {
  return new Promise<void>((resolve, reject) => {
    mw(req, res, (err?: unknown) => {
      if (err) reject(err)
      else resolve()
    })
  })
}

/** Multer instance: memory, 20MB/file */
function memUpload() {
  return multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 20 * 1024 * 1024, files: 40},
  })
}

async function nextProjectNo(client: SanityClient): Promise<number> {
  const max = await client.fetch<number>(
    `coalesce(*[_type == "workProject"] | order(projectNo desc)[0].projectNo, 0)`,
  )
  return (Number.isFinite(max) ? max : 0) + 1
}

async function nextFabricationSortNo(client: SanityClient): Promise<number> {
  const max = await client.fetch<number>(
    `coalesce(*[_type == "fabricationEntry"] | order(coalesce(sortNo, 0) desc)[0].sortNo, 0)`,
  )
  return (Number.isFinite(max) ? max : 0) + 1
}

function normalizeReorderIds(body: unknown): string[] | null {
  if (!body || typeof body !== 'object') return null
  const ids = (body as {ids?: unknown}).ids
  if (!Array.isArray(ids)) return null
  const out = ids.filter((x): x is string => typeof x === 'string' && x.length > 0)
  return out.length ? out : null
}

async function applyReorderRanks(
  client: SanityClient,
  ids: string[],
  field: 'projectNo' | 'sortNo',
) {
  const n = ids.length
  for (let i = 0; i < n; i++) {
    const id = ids[i]!
    const rank = (n - i) * 1000
    if (field === 'projectNo') {
      await client.patch(id).set({projectNo: rank}).commit()
    } else {
      await client.patch(id).set({sortNo: rank}).commit()
    }
  }
}

export function adminApiPlugin(): Plugin {
  let adminEnv: AdminEnv | null = null
  let adminApiDisabledReason: string | null = null
  let baseStrip = ''

  return {
    name: 'portfolio-admin-api',
    configResolved(config) {
      const load = loadAdminEnv(config.mode, config.root)
      if (load.status === 'ready') {
        adminEnv = load.env
        adminApiDisabledReason = null
      } else {
        adminEnv = null
        adminApiDisabledReason = load.message
      }
      const b = config.base ?? '/'
      baseStrip = b.replace(/\/$/, '')
    },
    configureServer(server) {
      const uploadNews = memUpload().array('images', 30)
      const uploadWork = memUpload().fields([
        {name: 'imagesLeft', maxCount: 30},
        {name: 'imagesRight', maxCount: 30},
      ])
      const uploadFab = memUpload().array('images', 30)

      server.middlewares.use(async (req, res, next) => {
        if (!req.url) return next()

        const rawPath = req.url.split('?')[0] ?? ''
        let pathname = rawPath
        if (baseStrip && rawPath.startsWith(baseStrip)) {
          pathname = rawPath.slice(baseStrip.length) || '/'
        }
        if (!pathname.startsWith('/api/admin')) return next()

        const r = req as IncomingMessage
        const s = res as ServerResponse

        if (req.method === 'OPTIONS') {
          corsOptions(s)
          return
        }

        if (!adminEnv) {
          json(s, 503, {
            ok: false,
            error:
              adminApiDisabledReason ??
              '관리 API 비활성: 환경 변수(SANITY_API_WRITE_TOKEN 등)를 확인하세요.',
          })
          return
        }

        const client = clientFromEnv(adminEnv)

        if (req.method === 'GET') {
          if (!verifySecret(r, adminEnv)) {
            json(s, 401, {ok: false, error: '인증이 필요합니다.'})
            return
          }
          try {
            if (pathname === '/api/admin/work-list') {
              const items = await client.fetch<
                Array<{_id: string; title: string | null; projectNo: number | null}>
              >(`*[_type == "workProject"] | order(projectNo desc) { _id, title, projectNo }`)
              json(s, 200, {ok: true, items})
              return
            }
            if (pathname === '/api/admin/fabrication-list') {
              const items = await client.fetch<
                Array<{_id: string; title: string | null; sortNo: number | null}>
              >(
                `*[_type == "fabricationEntry"] | order(coalesce(sortNo, 0) desc) { _id, title, "sortNo": coalesce(sortNo, 0) }`,
              )
              json(s, 200, {ok: true, items})
              return
            }
          } catch (e) {
            const msg = e instanceof Error ? e.message : String(e)
            json(s, 500, {ok: false, error: formatSanityClientError(msg)})
            return
          }
          json(s, 404, {ok: false, error: 'Not found'})
          return
        }

        if (req.method !== 'POST') {
          json(s, 405, {ok: false, error: 'Method not allowed'})
          return
        }

        try {
          if (pathname === '/api/admin/auth') {
            const body = (await readJsonBody(r)) as Record<string, unknown> | null
            const secret = typeof body?.secret === 'string' ? body.secret.trim() : ''
            if (secret && secret === adminEnv.secret) {
              json(s, 200, {ok: true})
              return
            }
            json(s, 401, {ok: false, error: '시크릿이 올바르지 않습니다.'})
            return
          }

          if (pathname === '/api/admin/work-reorder' || pathname === '/api/admin/fabrication-reorder') {
            const body = (await readJsonBody(r)) as Record<string, unknown> | null
            if (!verifySecret(r, adminEnv, body ?? undefined)) {
              json(s, 401, {ok: false, error: '인증이 필요합니다.'})
              return
            }
            const ids = normalizeReorderIds(body)
            if (!ids) {
              json(s, 400, {ok: false, error: 'JSON { "ids": string[] } 가 필요합니다.'})
              return
            }
            const field = pathname === '/api/admin/work-reorder' ? 'projectNo' : 'sortNo'
            await applyReorderRanks(client, ids, field)
            json(s, 200, {ok: true})
            return
          }

          if (
            pathname === '/api/admin/news' ||
            pathname === '/api/admin/work' ||
            pathname === '/api/admin/fabrication'
          ) {
            type MReq = IncomingMessage & {
              body?: Record<string, unknown>
              files?: unknown
            }
            const parseMultipart = (
              rq: IncomingMessage,
              rs: ServerResponse,
              cb: (err?: unknown) => void,
            ) => {
              const reqM = rq as MReq
              const resM = rs as ServerResponse
              // multer 타입은 Express Request를 기대하지만, Vite 미들웨어는 Node IncomingMessage와 런타임 호환됩니다.
              if (pathname === '/api/admin/news') uploadNews(reqM as never, resM as never, cb)
              else if (pathname === '/api/admin/work')
                uploadWork(reqM as never, resM as never, cb)
              else uploadFab(reqM as never, resM as never, cb)
            }
            await runMulter(r, s, parseMultipart)

            const rq = r as IncomingMessage & {
              body?: Record<string, unknown>
              files?: unknown
            }
            if (!verifySecret(r, adminEnv, rq.body)) {
              json(s, 401, {ok: false, error: '인증이 필요합니다.'})
              return
            }

            const body = rq.body as Record<string, unknown>

            if (pathname === '/api/admin/news') {
              const title = firstField(body, 'title')
              const date = firstField(body, 'date')
              const textBody = firstField(body, 'body')
              const files = rq.files as UploadedFile[] | undefined
              if (!title || !date || !textBody) {
                json(s, 400, {ok: false, error: 'title, date, body는 필수입니다.'})
                return
              }
              if (!files?.length) {
                json(s, 400, {ok: false, error: '이미지를 1장 이상 선택하세요.'})
                return
              }
              const images = await uploadImages(client, files)
              const slug = makeSlug(title)
              const doc = await client.create({
                _type: 'newsPost',
                title,
                slug: {_type: 'slug', current: slug},
                publishedAt: date,
                body: textBody,
                images,
              })
              json(s, 200, {ok: true, id: doc._id})
              return
            }

            if (pathname === '/api/admin/work') {
              const title = firstField(body, 'title')
              const subTitle = firstField(body, 'sub_title')
              const textBody = firstField(body, 'body')
              const fileMap = rq.files as {[fieldname: string]: UploadedFile[]} | undefined
              const left = fileMap?.imagesLeft
              const right = fileMap?.imagesRight
              if (!title || !textBody) {
                json(s, 400, {ok: false, error: 'title, body는 필수입니다.'})
                return
              }
              const projectNo = await nextProjectNo(client)
              if (!left?.length || !right?.length) {
                json(s, 400, {
                  ok: false,
                  error: '도면(왼쪽)·작품(오른쪽) 이미지를 각각 1장 이상 넣으세요.',
                })
                return
              }
              const imagesLeft = await uploadImages(client, left)
              const imagesRight = await uploadImages(client, right)
              const slug = makeSlug(title)
              const doc = await client.create({
                _type: 'workProject',
                projectNo,
                title,
                slug: {_type: 'slug', current: slug},
                subTitle: subTitle || undefined,
                body: textBody,
                imagesLeft,
                imagesRight,
              })
              json(s, 200, {ok: true, id: doc._id})
              return
            }

            const year = firstField(body, 'year')
            const title = firstField(body, 'title')
            const subTitle = firstField(body, 'sub_title')
            const category = firstField(body, 'category')
            const textBody = firstField(body, 'body')
            const files = rq.files as UploadedFile[] | undefined
            if (!year || !title || !textBody) {
              json(s, 400, {ok: false, error: 'year, title, body는 필수입니다.'})
              return
            }
            if (!files?.length) {
              json(s, 400, {ok: false, error: '이미지를 1장 이상 선택하세요.'})
              return
            }
            const images = await uploadImages(client, files)
            const slug = makeSlug(title)
            const sortNo = await nextFabricationSortNo(client)
            const doc = await client.create({
              _type: 'fabricationEntry',
              year,
              title,
              slug: {_type: 'slug', current: slug},
              subTitle: subTitle || undefined,
              category: category || undefined,
              body: textBody,
              images,
              sortNo,
            })
            json(s, 200, {ok: true, id: doc._id})
            return
          }

          json(s, 404, {ok: false, error: 'Unknown route'})
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          json(s, 500, {ok: false, error: formatSanityClientError(msg)})
        }
      })
    },
  }
}
