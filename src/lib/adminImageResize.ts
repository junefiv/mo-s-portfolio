/**
 * Admin multipart uploads — resize in the browser (aspect preserved) and re-encode as JPEG
 * to reduce payload size. Site `object-contain` only affects display, not bytes sent.
 */

const MAX_LONG_EDGE = 2560
const JPEG_QUALITY = 0.86
/** Skip processing for tiny files (icons). */
const SKIP_BELOW_BYTES = 140_000

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
      reject(new Error('image load failed'))
    }
    img.src = url
  })
}

function scaledDimensions(w: number, h: number): {tw: number; th: number} {
  if (w < 1 || h < 1) return {tw: w, th: h}
  const long = Math.max(w, h)
  if (long <= MAX_LONG_EDGE) return {tw: w, th: h}
  const s = MAX_LONG_EDGE / long
  return {tw: Math.round(w * s), th: Math.round(h * s)}
}

/**
 * Raster images only. Keeps aspect ratio; long edge capped at {@link MAX_LONG_EDGE}.
 * SVG / unreadable files are returned unchanged.
 */
export async function compressFileForAdminUpload(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/svg+xml') {
    return file
  }
  if (file.size > 0 && file.size < SKIP_BELOW_BYTES) {
    return file
  }
  let img: HTMLImageElement
  try {
    img = await loadImageFile(file)
  } catch {
    return file
  }
  const {naturalWidth: w, naturalHeight: h} = img
  const {tw, th} = scaledDimensions(w, h)
  if (tw < 1 || th < 1) return file

  const canvas = document.createElement('canvas')
  canvas.width = tw
  canvas.height = th
  const ctx = canvas.getContext('2d')
  if (!ctx) return file

  // JPEG has no alpha — avoid dark halos on PNG transparency
  ctx.fillStyle = '#ffffff'
  ctx.fillRect(0, 0, tw, th)
  ctx.drawImage(img, 0, 0, tw, th)

  const blob: Blob | null = await new Promise((resolve) => {
    canvas.toBlob((b) => resolve(b), 'image/jpeg', JPEG_QUALITY)
  })
  if (!blob || blob.size === 0) return file
  if (blob.size >= file.size * 0.97 && tw === w && th === h) {
    return file
  }
  const base = file.name.replace(/\.[^.]+$/, '') || 'image'
  return new File([blob], `${base}.jpg`, {type: 'image/jpeg', lastModified: Date.now()})
}

/** Copy FormData; replace each File with {@link compressFileForAdminUpload} output. */
export async function formDataWithResizedImages(fd: FormData): Promise<FormData> {
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
