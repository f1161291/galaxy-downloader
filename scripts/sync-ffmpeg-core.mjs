import { cp, mkdir, readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const sourceDirectory = fileURLToPath(
  new URL('../node_modules/@ffmpeg/core/dist/esm/', import.meta.url)
)
const targetDirectory = fileURLToPath(
  new URL('../public/ffmpeg-core/', import.meta.url)
)
const wasmPartSize = 16 * 1024 * 1024

await rm(targetDirectory, { recursive: true, force: true })
await mkdir(targetDirectory, { recursive: true })

const wasm = await readFile(`${sourceDirectory}ffmpeg-core.wasm`)
const wasmParts = Array.from(
  { length: Math.ceil(wasm.length / wasmPartSize) },
  (_, index) => wasm.subarray(index * wasmPartSize, (index + 1) * wasmPartSize)
)

await Promise.all([
  cp(`${sourceDirectory}ffmpeg-core.js`, `${targetDirectory}ffmpeg-core.js`),
  ...wasmParts.map((part, index) =>
    writeFile(`${targetDirectory}ffmpeg-core.wasm.part-${index}`, part)
  ),
])
