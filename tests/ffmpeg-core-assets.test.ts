import { access, stat } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'

import { getFFmpegCoreBaseUrls } from '../src/lib/ffmpeg.ts'

const publicDirectory = fileURLToPath(new URL('../public/ffmpeg-core/', import.meta.url))

describe('FFmpeg core assets', () => {
  it('prefers app-hosted assets before CDN fallbacks', () => {
    expect(getFFmpegCoreBaseUrls()).toEqual([
      '/ffmpeg-core',
      'https://cdn.jsdelivr.net/npm/@ffmpeg/core@0.12.9/dist/esm',
      'https://cdn.jsdmirror.com/npm/@ffmpeg/core@0.12.9/dist/esm',
    ])
  })

  it('contains deployable synced ESM core assets used by the worker loader', async () => {
    const [core, wasmPart0, wasmPart1] = await Promise.all([
      stat(`${publicDirectory}ffmpeg-core.js`),
      stat(`${publicDirectory}ffmpeg-core.wasm.part-0`),
      stat(`${publicDirectory}ffmpeg-core.wasm.part-1`),
    ])

    await Promise.all([
      access(`${publicDirectory}ffmpeg-core.js`),
      access(`${publicDirectory}ffmpeg-core.wasm.part-0`),
      access(`${publicDirectory}ffmpeg-core.wasm.part-1`),
    ])

    expect(core.size).toBeGreaterThan(100_000)
    expect(wasmPart0.size).toBeLessThanOrEqual(25 * 1024 * 1024)
    expect(wasmPart1.size).toBeLessThanOrEqual(25 * 1024 * 1024)
    expect(wasmPart0.size + wasmPart1.size).toBeGreaterThan(30_000_000)
  })
})
