/**
 * 포트폴리오 관리 API — Vite dev 미들웨어와 Vercel Serverless에서 공통 사용.
 * `[path].ts` 와 같은 폴더에 두고, Vercel 번들에 포함되도록 함.
 */
import {randomBytes} from 'node:crypto'
import type {IncomingMessage, ServerResponse} from 'node:http'
import {createClient, type SanityClient} from '@sanity/client'
import multer from 'multer'

export const SESSION_HEADER = 'x-admin-secret'

export type AdminEnv = {
  secret: string
  token: string
  projectId: string
  dataset: string
}

export type AdminEnvLoad =
  | {status: 'ready'; env: AdminEnv}
  | {status: 'disabled'; message: string}

const DEV_DEFAULT_ADMIN_SECRET = '123456'

function looksLikeSanityWriteToken(t: string) {
  const s = t.trim()
  return s.startsWith('sk') && s.length >= 16
}

/**
 * `loadEnv(mode, root, '')` 결과 또는 `process.env` 를 그대로 넘기면 됩니다.
 */
export function parsePortfolioAdminEnv(
  env: Record<string, string | undefined>,
  opts: {devFallbackSecret: boolean},
): AdminEnvLoad {
  const explicit = env.PORTFOLIO_ADMIN_SECRET?.trim()
  const secret =
    explicit || (opts.devFallbackSecret ? DEV_DEFAULT_ADMIN_SECRET : '')
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

/** GitHub Pages 등 다른 오리진에서 fetch 할 때 CORS 프리플라이트·본응답에 필요 */
export function attachAdminApiCorsHeaders(res: ServerResponse) {
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    `Content-Type, ${SESSION_HEADER}, X-Admin-Secret`,
  )
}

function json(res: ServerResponse, status: number, body: Record<string, unknown>) {
  res.statusCode = status
  attachAdminApiCorsHeaders(res)
  res.setHeader('Content-Type', 'application/json; charset=utf-8')
  res.end(JSON.stringify(body))
}

function corsOptions(res: ServerResponse) {
  attachAdminApiCorsHeaders(res)
  res.setHeader('Access-Control-Max-Age', '86400')
  // 일부 환경에서 204 프리플라이트가 "ok"로 인정되지 않는 경우가 있어 200 사용
  res.statusCode = 200
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

function memUpload() {
  return multer({
    storage: multer.memoryStorage(),
    limits: {fileSize: 20 * 1024 * 1024, files: 40},
  })
}

/** multer 타입은 Express Request 를 기대하지만 런타임은 Node IncomingMessage 와 호환 */
type MulterMw = (req: IncomingMessage, res: ServerResponse, next: (err?: unknown) => void) => void

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

function normalizeId(body: unknown): string | null {
  if (!body || typeof body !== 'object') return null
  const id = (body as {id?: unknown}).id
  return typeof id === 'string' && id.trim().length > 0 ? id.trim() : null
}

function parseIndexCsv(raw: string): number[] {
  const s = raw.trim()
  if (!s) return []
  const out: number[] = []
  for (const part of s.split(',')) {
    const n = parseInt(part.trim(), 10)
    if (Number.isInteger(n) && n >= 0) out.push(n)
  }
  return out
}

function removeByIndices<T>(arr: T[], indices: number[]): T[] {
  const uniq = [...new Set(indices)]
    .filter((i) => i >= 0 && i < arr.length)
    .sort((a, b) => b - a)
  const copy = [...arr]
  for (const i of uniq) copy.splice(i, 1)
  return copy
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

type MReq = IncomingMessage & {
  body?: Record<string, unknown>
  files?: unknown
}

export class PortfolioAdminApi {
  private uploadNewsMw: MulterMw | null = null
  private uploadWorkMw: MulterMw | null = null
  private uploadFabMw: MulterMw | null = null
  private readonly getLoad: () => AdminEnvLoad

  constructor(getLoad: () => AdminEnvLoad) {
    this.getLoad = getLoad
  }

  private getNewsMulter(): MulterMw {
    if (!this.uploadNewsMw) {
      this.uploadNewsMw = memUpload().array('images', 30) as MulterMw
    }
    return this.uploadNewsMw
  }

  private getWorkMulter(): MulterMw {
    if (!this.uploadWorkMw) {
      this.uploadWorkMw = memUpload().fields([
        {name: 'imagesLeft', maxCount: 30},
        {name: 'imagesRight', maxCount: 30},
      ]) as MulterMw
    }
    return this.uploadWorkMw
  }

  private getFabMulter(): MulterMw {
    if (!this.uploadFabMw) {
      this.uploadFabMw = memUpload().array('images', 30) as MulterMw
    }
    return this.uploadFabMw
  }

  /** pathname 예: `/api/admin/auth` (base 경로 제거 후) */
  async handle(req: IncomingMessage, res: ServerResponse, pathname: string): Promise<void> {
    const adminLoad = this.getLoad()

    if (req.method === 'OPTIONS') {
      corsOptions(res)
      return
    }

    if (adminLoad.status !== 'ready') {
      json(res, 503, {
        ok: false,
        error:
          adminLoad.message ??
          '관리 API 비활성: 환경 변수(SANITY_API_WRITE_TOKEN 등)를 확인하세요.',
      })
      return
    }

    const adminEnv = adminLoad.env
    const client = clientFromEnv(adminEnv)

    if (req.method === 'GET') {
      if (!verifySecret(req, adminEnv)) {
        json(res, 401, {ok: false, error: '인증이 필요합니다.'})
        return
      }
      try {
        if (pathname === '/api/admin/work-list') {
          const items = await client.fetch<
            Array<{_id: string; title: string | null; projectNo: number | null}>
          >(`*[_type == "workProject"] | order(projectNo desc) { _id, title, projectNo }`)
          json(res, 200, {ok: true, items})
          return
        }
        if (pathname === '/api/admin/fabrication-list') {
          const items = await client.fetch<
            Array<{_id: string; title: string | null; sortNo: number | null}>
          >(
            `*[_type == "fabricationEntry"] | order(coalesce(sortNo, 0) desc) { _id, title, "sortNo": coalesce(sortNo, 0) }`,
          )
          json(res, 200, {ok: true, items})
          return
        }
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e)
        json(res, 500, {ok: false, error: formatSanityClientError(msg)})
        return
      }
      json(res, 404, {ok: false, error: 'Not found'})
      return
    }

    if (req.method !== 'POST') {
      json(res, 405, {ok: false, error: 'Method not allowed'})
      return
    }

    try {
      if (pathname === '/api/admin/auth') {
        const body = (await readJsonBody(req)) as Record<string, unknown> | null
        const secret = typeof body?.secret === 'string' ? body.secret.trim() : ''
        if (secret && secret === adminEnv.secret) {
          json(res, 200, {ok: true})
          return
        }
        json(res, 401, {ok: false, error: '시크릿이 올바르지 않습니다.'})
        return
      }

      if (pathname === '/api/admin/work-fetch' || pathname === '/api/admin/fabrication-fetch') {
        const body = (await readJsonBody(req)) as Record<string, unknown> | null
        if (!verifySecret(req, adminEnv, body ?? undefined)) {
          json(res, 401, {ok: false, error: '인증이 필요합니다.'})
          return
        }
        const docId = normalizeId(body)
        if (!docId) {
          json(res, 400, {ok: false, error: 'JSON { "id": string } 가 필요합니다.'})
          return
        }
        try {
          if (pathname === '/api/admin/work-fetch') {
            const doc = await client.fetch<
              | {
                  _id: string
                  projectNo: number | null
                  title: string | null
                  subTitle: string | null
                  body: string | null
                  imagesLeft: Array<{url: string | null} | null> | null
                  imagesRight: Array<{url: string | null} | null> | null
                }
              | null
            >(
              `*[_id == $id && _type == "workProject"][0]{
                _id, projectNo, title, subTitle, body,
                "imagesLeft": imagesLeft[]{ "url": asset->url },
                "imagesRight": imagesRight[]{ "url": asset->url }
              }`,
              {id: docId},
            )
            if (!doc) {
              json(res, 404, {ok: false, error: '문서를 찾을 수 없습니다.'})
              return
            }
            json(res, 200, {ok: true, doc})
            return
          }
          const doc = await client.fetch<
            | {
                _id: string
                year: string | null
                title: string | null
                subTitle: string | null
                category: string | null
                body: string | null
                images: (string | null)[] | null
              }
            | null
          >(
            `*[_id == $id && _type == "fabricationEntry"][0]{
              _id, year, title, subTitle, category, body,
              "images": images[].asset->url
            }`,
            {id: docId},
          )
          if (!doc) {
            json(res, 404, {ok: false, error: '문서를 찾을 수 없습니다.'})
            return
          }
          json(res, 200, {ok: true, doc})
          return
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          json(res, 500, {ok: false, error: formatSanityClientError(msg)})
          return
        }
      }

      if (pathname === '/api/admin/work-delete' || pathname === '/api/admin/fabrication-delete') {
        const body = (await readJsonBody(req)) as Record<string, unknown> | null
        if (!verifySecret(req, adminEnv, body ?? undefined)) {
          json(res, 401, {ok: false, error: '인증이 필요합니다.'})
          return
        }
        const docId = normalizeId(body)
        if (!docId) {
          json(res, 400, {ok: false, error: 'JSON { "id": string } 가 필요합니다.'})
          return
        }
        try {
          const tp = pathname === '/api/admin/work-delete' ? 'workProject' : 'fabricationEntry'
          const exists = await client.fetch<string | null>(
            `*[_id == $id && _type == $tp][0]._id`,
            {id: docId, tp},
          )
          if (!exists) {
            json(res, 404, {ok: false, error: '문서를 찾을 수 없습니다.'})
            return
          }
          await client.delete(docId)
          json(res, 200, {ok: true})
          return
        } catch (e) {
          const msg = e instanceof Error ? e.message : String(e)
          json(res, 500, {ok: false, error: formatSanityClientError(msg)})
          return
        }
      }

      if (pathname === '/api/admin/work-reorder' || pathname === '/api/admin/fabrication-reorder') {
        const body = (await readJsonBody(req)) as Record<string, unknown> | null
        if (!verifySecret(req, adminEnv, body ?? undefined)) {
          json(res, 401, {ok: false, error: '인증이 필요합니다.'})
          return
        }
        const ids = normalizeReorderIds(body)
        if (!ids) {
          json(res, 400, {ok: false, error: 'JSON { "ids": string[] } 가 필요합니다.'})
          return
        }
        const field = pathname === '/api/admin/work-reorder' ? 'projectNo' : 'sortNo'
        await applyReorderRanks(client, ids, field)
        json(res, 200, {ok: true})
        return
      }

      if (
        pathname === '/api/admin/news' ||
        pathname === '/api/admin/work' ||
        pathname === '/api/admin/fabrication' ||
        pathname === '/api/admin/work-update' ||
        pathname === '/api/admin/fabrication-update'
      ) {
        const parseMultipart = (
          rq: IncomingMessage,
          rs: ServerResponse,
          cb: (err?: unknown) => void,
        ) => {
          const reqM = rq as MReq
          const resM = rs as ServerResponse
          if (pathname === '/api/admin/news') this.getNewsMulter()(reqM as never, resM as never, cb)
          else if (pathname === '/api/admin/work' || pathname === '/api/admin/work-update')
            this.getWorkMulter()(reqM as never, resM as never, cb)
          else this.getFabMulter()(reqM as never, resM as never, cb)
        }
        await runMulter(req, res, parseMultipart)

        const rq = req as MReq
        if (!verifySecret(req, adminEnv, rq.body)) {
          json(res, 401, {ok: false, error: '인증이 필요합니다.'})
          return
        }

        const body = rq.body as Record<string, unknown>

        if (pathname === '/api/admin/news') {
          const title = firstField(body, 'title')
          const date = firstField(body, 'date')
          const textBody = firstField(body, 'body')
          const files = rq.files as UploadedFile[] | undefined
          if (!title || !date || !textBody) {
            json(res, 400, {ok: false, error: 'title, date, body는 필수입니다.'})
            return
          }
          if (!files?.length) {
            json(res, 400, {ok: false, error: '이미지를 1장 이상 선택하세요.'})
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
          json(res, 200, {ok: true, id: doc._id})
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
            json(res, 400, {ok: false, error: 'title, body는 필수입니다.'})
            return
          }
          const projectNo = await nextProjectNo(client)
          if (!left?.length || !right?.length) {
            json(res, 400, {
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
          json(res, 200, {ok: true, id: doc._id})
          return
        }

        if (pathname === '/api/admin/work-update') {
          const docId = firstField(body, '_id')
          if (!docId) {
            json(res, 400, {ok: false, error: '_id 가 필요합니다.'})
            return
          }
          const exists = await client.fetch<string | null>(
            `*[_id == $id && _type == "workProject"][0]._id`,
            {id: docId},
          )
          if (!exists) {
            json(res, 404, {ok: false, error: '문서를 찾을 수 없습니다.'})
            return
          }
          const title = firstField(body, 'title')
          const subTitle = firstField(body, 'sub_title')
          const textBody = firstField(body, 'body')
          if (!title || !textBody) {
            json(res, 400, {ok: false, error: 'title, body는 필수입니다.'})
            return
          }
          const fileMap = rq.files as {[fieldname: string]: UploadedFile[]} | undefined
          const newLeft = fileMap?.imagesLeft
          const newRight = fileMap?.imagesRight
          const rmL = parseIndexCsv(firstField(body, 'remove_left_indexes'))
          const rmR = parseIndexCsv(firstField(body, 'remove_right_indexes'))
          const hasImageChange =
            rmL.length > 0 || rmR.length > 0 || (newLeft?.length ?? 0) > 0 || (newRight?.length ?? 0) > 0

          const setDoc: Record<string, unknown> = {
            title,
            body: textBody,
            slug: {_type: 'slug', current: makeSlug(title)},
          }
          if (subTitle) setDoc.subTitle = subTitle
          else setDoc.subTitle = ''

          if (hasImageChange) {
            const cur = await client.fetch<{
              imagesLeft: Array<Record<string, unknown>> | null
              imagesRight: Array<Record<string, unknown>> | null
            } | null>(`*[_id == $id && _type == "workProject"][0]{ imagesLeft, imagesRight }`, {id: docId})
            if (!cur) {
              json(res, 404, {ok: false, error: '문서를 찾을 수 없습니다.'})
              return
            }
            let leftArr = [...(cur.imagesLeft ?? [])]
            let rightArr = [...(cur.imagesRight ?? [])]
            leftArr = removeByIndices(leftArr, rmL)
            rightArr = removeByIndices(rightArr, rmR)
            if (newLeft?.length) {
              const up = await uploadImages(client, newLeft)
              leftArr = [...leftArr, ...up]
            }
            if (newRight?.length) {
              const up = await uploadImages(client, newRight)
              rightArr = [...rightArr, ...up]
            }
            if (!leftArr.length || !rightArr.length) {
              json(res, 400, {
                ok: false,
                error:
                  '도면(왼쪽)·작품(오른쪽)에 이미지가 각각 최소 1장 있어야 합니다. 삭제·추가 후 다시 확인하세요.',
              })
              return
            }
            setDoc.imagesLeft = leftArr
            setDoc.imagesRight = rightArr
          }

          await client.patch(docId).set(setDoc).commit()
          json(res, 200, {ok: true, id: docId})
          return
        }

        if (pathname === '/api/admin/fabrication') {
          const year = firstField(body, 'year')
          const title = firstField(body, 'title')
          const subTitle = firstField(body, 'sub_title')
          const category = firstField(body, 'category')
          const textBody = firstField(body, 'body')
          const files = rq.files as UploadedFile[] | undefined
          if (!year || !title || !textBody) {
            json(res, 400, {ok: false, error: 'year, title, body는 필수입니다.'})
            return
          }
          if (!files?.length) {
            json(res, 400, {ok: false, error: '이미지를 1장 이상 선택하세요.'})
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
          json(res, 200, {ok: true, id: doc._id})
          return
        }

        if (pathname === '/api/admin/fabrication-update') {
          const docId = firstField(body, '_id')
          if (!docId) {
            json(res, 400, {ok: false, error: '_id 가 필요합니다.'})
            return
          }
          const exists = await client.fetch<string | null>(
            `*[_id == $id && _type == "fabricationEntry"][0]._id`,
            {id: docId},
          )
          if (!exists) {
            json(res, 404, {ok: false, error: '문서를 찾을 수 없습니다.'})
            return
          }
          const year = firstField(body, 'year')
          const title = firstField(body, 'title')
          const subTitle = firstField(body, 'sub_title')
          const category = firstField(body, 'category')
          const textBody = firstField(body, 'body')
          if (!year || !title || !textBody) {
            json(res, 400, {ok: false, error: 'year, title, body는 필수입니다.'})
            return
          }
          const filesFab = rq.files as UploadedFile[] | undefined
          const rmImg = parseIndexCsv(firstField(body, 'remove_image_indexes'))
          const hasImageChange = rmImg.length > 0 || (filesFab?.length ?? 0) > 0

          const setFab: Record<string, unknown> = {
            year,
            title,
            body: textBody,
            slug: {_type: 'slug', current: makeSlug(title)},
          }
          if (subTitle) setFab.subTitle = subTitle
          else setFab.subTitle = ''
          if (category) setFab.category = category
          else setFab.category = ''

          if (hasImageChange) {
            const cur = await client.fetch<{images: Array<Record<string, unknown>> | null} | null>(
              `*[_id == $id && _type == "fabricationEntry"][0]{ images }`,
              {id: docId},
            )
            if (!cur) {
              json(res, 404, {ok: false, error: '문서를 찾을 수 없습니다.'})
              return
            }
            let imgArr = [...(cur.images ?? [])]
            imgArr = removeByIndices(imgArr, rmImg)
            if (filesFab?.length) {
              const up = await uploadImages(client, filesFab)
              imgArr = [...imgArr, ...up]
            }
            if (!imgArr.length) {
              json(res, 400, {
                ok: false,
                error: '이미지는 최소 1장 있어야 합니다. 삭제·추가 후 다시 확인하세요.',
              })
              return
            }
            setFab.images = imgArr
          }

          await client.patch(docId).set(setFab).commit()
          json(res, 200, {ok: true, id: docId})
          return
        }

        json(res, 404, {ok: false, error: 'Unknown multipart route'})
        return
      }

      json(res, 404, {ok: false, error: 'Unknown route'})
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e)
      json(res, 500, {ok: false, error: formatSanityClientError(msg)})
    }
  }
}
