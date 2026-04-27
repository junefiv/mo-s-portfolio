/**
 * 관리 API multipart 업로드용 — Vercel 요청 본문(약 4.5MB)·서버리스 실행 시간 제한을 넘기지 않게
 * 브라우저에서 래스터 이미지를 가로세로·JPEG 품질로 줄인 뒤 전송.
 */

const MAX_EDGE_PX = 2560
const JPEG_QUALITY = 0.88
/** 이 크기 이하면 압축 생략(아이콘·썸네일) — 그보다 크면 다중 선택 시 본문 한도에 걸리기 쉬움 */
const SKIP_IF_BELOW_BYTES = 120_000

function loadImageFile(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file)
    const img = new Image()
    img.onload = () => {
      URL.revokeObjectURL(url)
      resolve(img)
    }
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('load'))
    }
    img.src = url
  })
}

/**
 * `image/*` 래스터만 JPEG로 축소. SVG·로드 실패·작은 파일은 원본 유지.
 */
export async function compressFileForAdminUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }
  if (file.size > 0 && file.size < SKIP_IF_BELOW_BYTES) {
    return file
  }
  let img: HTMLImageElement
  try {
    img = await loadImageFile(file)
  } catch {
    return file
  }
  const w = img.naturalWidth
  const h = img.naturalHeight
  if (w < 1 || h < 1) return file

  let tw = w
  let th = h
  if (w > MAX_EDGE_PX || h > MAX_EDGE_PX) {
    const s = MAX_EDGE_PX / Math.max(w, h)
    tw = Math.round(w * s)
    th = Math.round(h * s)
  }

  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')
  if (!ctx) return file
  ctx.drawImage(img, 0, 0, tw, th)

  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob(
      (b) => resolve(b),
      'image/jpeg',
      JPEG_QUALITY,
    )
  })
  if (!blob || blob.size === 0) return file
  if (blob.size >= file.size * 0.98 && tw === w && th === h) {
    return file
  }
  const base = file.name.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${base}.jpg`, {type: 'image/jpeg', lastModified: Date.now()})
}

/** FormData: 파일 항목만 압축한 복제본(텍스트 필드는 그대로) */
export async function formDataWithCompressedImages(fd: FormData): Promise<FormData> {
  const out = new FormData()
  for (const [key, value] of fd.entries()) {
    if (value instanceof File) {
      const c = await compressFileForAdminUpload(value)
      out.append(key, c, c.name)
    } else {
      out.append(key, value)
    }
  }
  return out
}
