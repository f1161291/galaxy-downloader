import { describe, expect, it, vi } from 'vitest'

import { GET as getProxyImage } from '../src/app/api/proxy-image/route.ts'

function createRouteRequest(url: string) {
    return {
        nextUrl: new URL(url),
        headers: new Headers(),
    }
}

function buildProxyImageUrl(target: string) {
    return `https://downloader.bhwa233.com/api/proxy-image?url=${encodeURIComponent(target)}`
}

async function captureUpstreamUrl(target: string): Promise<string> {
    const fetchMock = vi.fn(async () => new Response('image-bytes', {
        headers: { 'content-type': 'image/jpeg' },
    }))
    vi.stubGlobal('fetch', fetchMock)

    try {
        await getProxyImage(createRouteRequest(buildProxyImageUrl(target)) as never)
    } finally {
        vi.unstubAllGlobals()
    }

    expect(fetchMock).toHaveBeenCalledTimes(1)
    return String((fetchMock.mock.calls[0] as unknown as [RequestInfo | URL])[0])
}

describe('proxy-image route', () => {
    it('rewrites biliimg covers onto the hdslb host', async () => {
        const upstreamUrl = await captureUpstreamUrl(
            'https://archive.biliimg.com/bfs/archive/f2ce6e389db035229a201c5f29ee3b4832ac583e.jpg'
        )

        expect(upstreamUrl).toBe(
            'https://i0.hdslb.com/bfs/archive/f2ce6e389db035229a201c5f29ee3b4832ac583e.jpg'
        )
    })

    it('upgrades http covers to https without changing the host', async () => {
        const upstreamUrl = await captureUpstreamUrl(
            'http://i2.hdslb.com/bfs/archive/f2ce6e389db035229a201c5f29ee3b4832ac583e.jpg'
        )

        expect(upstreamUrl).toBe(
            'https://i2.hdslb.com/bfs/archive/f2ce6e389db035229a201c5f29ee3b4832ac583e.jpg'
        )
    })
})
