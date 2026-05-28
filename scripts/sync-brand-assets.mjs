import fs from 'node:fs'
import path from 'node:path'
import sharp from 'sharp'

const SRC = 'src/assets/logo.png'
const OUT_DIR = 'public'
const BG = { r: 0, g: 0, b: 0, alpha: 1 }

if (!fs.existsSync(SRC)) {
  console.error(`Missing ${SRC}`)
  process.exit(1)
}

fs.mkdirSync(OUT_DIR, { recursive: true })

async function writeSquarePng(filename, size) {
  await sharp(SRC)
    .resize(size, size, { fit: 'contain', background: BG })
    .png({ compressionLevel: 9 })
    .toFile(path.join(OUT_DIR, filename))
}

await writeSquarePng('favicon-48.png', 48)
await writeSquarePng('favicon.png', 192)
await writeSquarePng('apple-touch-icon.png', 180)
await writeSquarePng('og.png', 1200)

console.log('Synced brand assets from src/assets/logo.png → public/')
