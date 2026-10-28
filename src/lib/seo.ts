import { i18n, type Locale } from "@/lib/i18n/config"

const PRODUCTION_SITE_URL = "https://downloader.bhwa233.com"
const DEVELOPMENT_SITE_URL = "http://localhost:3010"

function normalizeSiteUrl(url: string | undefined): string | null {
    if (!url) return null

    try {
        return new URL(url).toString().replace(/\/$/, "")
    } catch {
        return null
    }
}

function normalizePath(path = ""): string {
    if (!path) return ""
    return path.startsWith("/") ? path : `/${path}`
}

const explicitIndexableFlag = process.env.SEO_INDEXABLE ?? process.env.NEXT_PUBLIC_SEO_INDEXABLE
const isVercel = typeof process.env.VERCEL_ENV === "string"
const defaultSiteUrl = process.env.NODE_ENV === "production"
    ? PRODUCTION_SITE_URL
    : DEVELOPMENT_SITE_URL

export const SITE_URL = normalizeSiteUrl(process.env.NEXT_PUBLIC_SITE_URL) ?? defaultSiteUrl
export const IS_INDEXABLE = explicitIndexableFlag
    ? explicitIndexableFlag === "true"
    : isVercel
      ? process.env.VERCEL_ENV === "production"
      : process.env.NODE_ENV === "production"

const PUBLIC_METADATA_COPY: Record<Locale, { description: string }> = {
    en: {
        description: "Free online media downloader for public video, audio, image posts, and HLS/M3U8 streams. Auto-detect supported links and download media without registration.",
    },
    zh: {
        description: "免费在线媒体下载工具，支持公开视频、音频、图文内容与 HLS/M3U8 串流链接识别和下载，无需注册。",
    },
    'zh-tw': {
        description: "免費線上媒體下載工具，支援公開影片、音訊、圖文內容與 HLS/M3U8 串流連結識別和下載，無需註冊。",
    },
    ja: {
        description: "公開動画、音声、画像投稿、HLS/M3U8 ストリーム向けの無料オンラインメディアダウンローダー。対応リンクを自動判別し、登録不要でダウンロードできます。",
    },
    es: {
        description: "Descargador online gratuito para videos publicos, audio, publicaciones con imagen y transmisiones HLS/M3U8. Detecta enlaces compatibles y descarga contenido sin registro.",
    },
    ru: {
        description: "Besplatnyi onlain zagruzchik media dlya publichnykh video, audio, postov s izobrazheniyami i HLS/M3U8-potokov. Avtomaticheski opredelyaet podderzhivaemye ssylki i zagruzhaet kontent bez registratsii.",
    },
}

export function resolvePublicMetadataDescription(locale: Locale): string {
    return PUBLIC_METADATA_COPY[locale].description
}

export function localeToHrefLang(locale: Locale): string {
    if (locale === "zh") return "zh-CN"
    if (locale === "zh-tw") return "zh-TW"
    if (locale === "ja") return "ja-JP"
    if (locale === "es") return "es-ES"
    if (locale === "ru") return "ru-RU"
    return "en"
}

export function localeToOpenGraphLocale(locale: Locale): string {
    if (locale === "zh") return "zh_CN"
    if (locale === "zh-tw") return "zh_TW"
    if (locale === "ja") return "ja_JP"
    if (locale === "es") return "es_ES"
    if (locale === "ru") return "ru_RU"
    return "en_US"
}

export function localeToHtmlLang(locale: Locale): string {
    if (locale === "zh") return "zh-CN"
    if (locale === "zh-tw") return "zh-TW"
    if (locale === "ja") return "ja-JP"
    if (locale === "es") return "es-ES"
    if (locale === "ru") return "ru-RU"
    return "en"
}

export function resolveSiteAlternateName(_locale: Locale): string {
    return "sparkdownloader"
}

export function sanitizeStructuredDataTextList(values: string[]): string[] {
    const seen = new Set<string>()

    return values
        .map((value) => value.trim())
        .filter((value) => value.length > 0)
        .filter((value) => !/^[?？]+$/.test(value))
        .filter((value) => {
            if (seen.has(value)) {
                return false
            }

            seen.add(value)
            return true
        })
}

function normalizeHeaderToken(value: string): string {
    return value.trim().toLowerCase()
}

export function appendVaryHeader(headers: Headers, values: string[]): void {
    const existing = headers.get("Vary")
    const merged = new Map<string, string>()

    if (existing) {
        for (const value of existing.split(",")) {
            const trimmed = value.trim()
            if (!trimmed) continue
            merged.set(normalizeHeaderToken(trimmed), trimmed)
        }
    }

    for (const value of values) {
        const trimmed = value.trim()
        if (!trimmed) continue
        merged.set(normalizeHeaderToken(trimmed), trimmed)
    }

    if (merged.size > 0) {
        headers.set("Vary", Array.from(merged.values()).join(", "))
    }
}

export function setXRobotsTag(headers: Headers, directives: string[]): void {
    const sanitized = directives
        .map((directive) => directive.trim().toLowerCase())
        .filter((directive) => directive.length > 0)

    if (sanitized.length === 0) {
        headers.delete("X-Robots-Tag")
        return
    }

    headers.set("X-Robots-Tag", Array.from(new Set(sanitized)).join(", "))
}

export function buildLocaleUrl(locale: Locale, path = ""): string {
    return `${SITE_URL}/${locale}${normalizePath(path)}`
}

export function buildXDefaultUrl(path = ""): string {
    return buildLocaleUrl(i18n.defaultLocale, path)
}

export function buildLanguageAlternates(path = ""): Record<string, string> {
    const alternates: Record<string, string> = {}
    for (const locale of i18n.locales) {
        alternates[localeToHrefLang(locale)] = buildLocaleUrl(locale, path)
    }

    alternates["x-default"] = buildXDefaultUrl(path)
    return alternates
}

export function buildOpenGraphLocaleAlternates(locale: Locale): string[] {
    return i18n.locales
        .filter((item) => item !== locale)
        .map((item) => localeToOpenGraphLocale(item))
}
