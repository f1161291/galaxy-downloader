import { describe, expect, it } from 'vitest'

import {
    isHlsPlaylistUrl,
    isHlsPlaylistResponse,
} from '../src/lib/hls-playback.ts'

describe('hls playback helpers', () => {
    it('detects hls playlists by content type, extension, or body', () => {
        expect(isHlsPlaylistUrl('https://cdn.example.com/master.m3u8?token=1')).toBe(true)
        expect(isHlsPlaylistResponse('https://cdn.example.com/master.m3u8', null)).toBe(true)
        expect(isHlsPlaylistResponse('https://cdn.example.com/raw', 'application/vnd.apple.mpegurl')).toBe(true)
        expect(isHlsPlaylistResponse('https://cdn.example.com/raw', 'text/plain', '#EXTM3U\n#EXTINF:4.0,\nseg.ts')).toBe(true)
        expect(isHlsPlaylistResponse('https://cdn.example.com/video.mp4', 'video/mp4')).toBe(false)
    })
})
