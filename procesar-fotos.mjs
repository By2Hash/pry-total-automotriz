import { spawnSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readdirSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.dirname(fileURLToPath(import.meta.url))
const sourceDir = path.join(rootDir, 'fotos-originales')
const outputDir = path.join(rootDir, 'public', 'fotos')
const manifestPath = path.join(outputDir, 'manifest.json')
const ffmpeg = process.env.FFMPEG_PATH || 'ffmpeg'

const IMAGE_EXTENSIONS = new Set(['.jpg', '.jpeg', '.png', '.webp'])
const collator = new Intl.Collator('es', { numeric: true, sensitivity: 'base' })

function checkFfmpeg() {
  const result = spawnSync(ffmpeg, ['-version'], { stdio: 'ignore' })
  if (result.error || result.status !== 0) {
    console.error(
      'No se encontró ffmpeg. Instalalo o definí FFMPEG_PATH con la ruta al ejecutable.',
    )
    process.exit(1)
  }
}

function listVehicleFolders() {
  return readdirSync(sourceDir, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const match = entry.name.match(/^(\d+)\s+(.+)$/)
      if (!match) return null
      return {
        id: Number(match[1]),
        name: match[2],
        dir: path.join(sourceDir, entry.name),
      }
    })
    .filter(Boolean)
    .sort((a, b) => a.id - b.id)
}

function listImages(dir) {
  return readdirSync(dir, { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isFile() &&
        IMAGE_EXTENSIONS.has(path.extname(entry.name).toLowerCase()),
    )
    .map((entry) => entry.name)
    .sort((a, b) => collator.compare(a, b))
}

function convert(input, output, width, quality) {
  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-y',
    '-i',
    input,
    '-vf',
    `scale=w='min(${width},iw)':h=-2`,
    '-c:v',
    'libwebp',
    '-quality',
    String(quality),
    '-compression_level',
    '6',
    '-preset',
    'picture',
    '-map_metadata',
    '-1',
    '-an',
    output,
  ]

  const result = spawnSync(ffmpeg, args, { encoding: 'utf8' })

  if (result.error) throw result.error
  if (result.status !== 0) {
    throw new Error(result.stderr?.trim() || `ffmpeg terminó con ${result.status}`)
  }
}

if (!existsSync(sourceDir)) {
  console.error(`No existe la carpeta ${sourceDir}.`)
  process.exit(1)
}

checkFfmpeg()

const folders = listVehicleFolders()
if (!folders.length) {
  console.error('No se encontraron carpetas de vehículos en fotos-originales.')
  process.exit(1)
}

// public/fotos es una carpeta generada: se reconstruye completa en cada corrida.
rmSync(outputDir, { recursive: true, force: true })
mkdirSync(outputDir, { recursive: true })

const manifest = {}
let images = 0
let emptyFolders = 0
let errors = 0

for (const vehicle of folders) {
  const files = listImages(vehicle.dir)

  if (!files.length) {
    emptyFolders += 1
    console.log(`— ${vehicle.id} ${vehicle.name}: sin fotos`)
    continue
  }

  const vehicleDir = path.join(outputDir, String(vehicle.id))
  mkdirSync(vehicleDir, { recursive: true })

  const entries = []

  for (const [index, file] of files.entries()) {
    const number = index + 1
    const largeName = `${number}.webp`
    const thumbName = `${number}-thumb.webp`

    try {
      convert(
        path.join(vehicle.dir, file),
        path.join(vehicleDir, largeName),
        1600,
        80,
      )
      convert(
        path.join(vehicle.dir, file),
        path.join(vehicleDir, thumbName),
        480,
        70,
      )
      entries.push({
        src: `/fotos/${vehicle.id}/${largeName}`,
        thumb: `/fotos/${vehicle.id}/${thumbName}`,
      })
      images += 1
    } catch (error) {
      errors += 1
      console.error(`\nError en ${vehicle.id} / ${file}: ${error.message}`)
    }
  }

  if (entries.length) {
    manifest[vehicle.id] = entries
  }

  console.log(`✓ ${vehicle.id} ${vehicle.name}: ${entries.length} fotos`)
}

writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`)

console.log('\nResumen')
console.log(`Vehículos con fotos: ${Object.keys(manifest).length}`)
console.log(`Imágenes procesadas: ${images}`)
console.log(`Carpetas sin fotos: ${emptyFolders}`)
console.log(`Errores: ${errors}`)
console.log(`Manifest: ${manifestPath}`)

if (errors) process.exitCode = 1
