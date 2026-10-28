import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/types'
import {
    SITE_URL,
    buildLocaleUrl,
    localeToHtmlLang,
    resolveSiteAlternateName,
    resolvePublicMetadataDescription,
    sanitizeStructuredDataTextList,
} from '@/lib/seo'
import { getPlatformSupportItems } from '@/components/downloader/platform-support'

interface StructuredDataProps {
    locale: Locale
    dict: Dictionary
}

type PlatformSupportEntry = {
    name: string
    summary: string
}

const HIDDEN_PLATFORM_TERMS = [
    'bilibili',
    'douyin',
    'wechat',
    'weibo',
    'xiaohongshu',
    '哔哩哔哩',
    '嗶哩嗶哩',
    '抖音',
    '微信公众号',
    '微信公眾號',
    '微博',
    '小红书',
    '小紅書',
]

function buildPlatformSupportFeatureList(dict: Dictionary): string[] {
    return getPlatformSupportItems(dict).map(({ key, name }) => {
        const entry = dict.guide.platformSupport[key] as PlatformSupportEntry
        return `${name}: ${entry.summary}`
    })
}

export function StructuredData({ locale, dict }: StructuredDataProps) {
    const localeUrl = buildLocaleUrl(locale)
    const seoLocale: keyof Dictionary['seo']['features'] = locale
    const publicDescription = resolvePublicMetadataDescription(locale)
    const featureList = sanitizeStructuredDataTextList([
        ...dict.seo.features[seoLocale],
        ...buildPlatformSupportFeatureList(dict),
    ]).filter((value) => {
        const normalized = value.toLowerCase()
        return !HIDDEN_PLATFORM_TERMS.some((term) => normalized.includes(term.toLowerCase()))
    })

    const websiteSchema = {
        "@context": "https://schema.org",
        "@type": "WebSite",
        "name": dict.metadata.siteName,
        "alternateName": resolveSiteAlternateName(locale),
        "description": publicDescription,
        "url": localeUrl,
        "inLanguage": localeToHtmlLang(locale),
        "creator": {
            "@type": "Organization",
            "name": dict.metadata.siteName
        },
        "publisher": {
            "@type": "Organization",
            "name": dict.metadata.siteName
        }
    }

    const webApplicationSchema = {
        "@context": "https://schema.org",
        "@type": "WebApplication",
        "name": dict.metadata.siteName,
        "description": publicDescription,
        "url": localeUrl,
        "applicationCategory": "UtilitiesApplication",
        "operatingSystem": "Any",
        "browserRequirements": "Requires JavaScript and a modern web browser.",
        "offers": {
            "@type": "Offer",
            "price": "0",
            "priceCurrency": "USD"
        },
        "featureList": featureList
    }

    const organizationSchema = {
        "@context": "https://schema.org",
        "@type": "Organization",
        "name": dict.metadata.siteName,
        "url": SITE_URL,
        "logo": `${SITE_URL}/icons/icon-512x512.png`,
        "sameAs": [
            "https://github.com/lxw15337674/galaxy-downloader",
        ],
        "contactPoint": [
            {
                "@type": "ContactPoint",
                "contactType": "customer support",
                "url": `${localeUrl}/contact`,
                "availableLanguage": [localeToHtmlLang(locale)],
            },
        ],
    }

    return (
        <>
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(websiteSchema)
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(webApplicationSchema)
                }}
            />
            <script
                type="application/ld+json"
                dangerouslySetInnerHTML={{
                    __html: JSON.stringify(organizationSchema)
                }}
            />
        </>
    )
}
