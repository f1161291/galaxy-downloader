export const HLS_PLAYLIST_ACCEPT =
    'application/vnd.apple.mpegurl, application/x-mpegURL, text/plain;q=0.9, */*;q=0.8'

const HLS_PLAYLIST_CONTENT_TYPES = [
    'application/vnd.apple.mpegurl',
    'application/x-mpegurl',
]

export function isHlsPlaylistUrl(url: string | null | undefined): url is string {
    return typeof url === 'string' && /\.m3u8?(?:[?#]|$)/i.test(url.trim())
}

export function isHlsPlaylistResponse(
    targetUrl: string,
    contentType: string | null,
    bodyText?: string
): boolean {
    const normalizedContentType = (contentType || '').toLowerCase()
    if (HLS_PLAYLIST_CONTENT_TYPES.some((value) => normalizedContentType.includes(value))) {
        return true
    }

    if (isHlsPlaylistUrl(targetUrl)) {
        return true
    }

    return typeof bodyText === 'string' && bodyText.trimStart().startsWith('#EXTM3U')
}
