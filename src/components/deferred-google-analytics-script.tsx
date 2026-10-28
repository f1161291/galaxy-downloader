'use client'

import { useEffect } from 'react'

const GA_ID = 'G-0BEHLKM3W5'
const GA_SRC = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`
const SCRIPT_SELECTOR = 'script[data-ga-loader="deferred"]'
const INLINE_SCRIPT_ID = 'google-analytics-inline'

function ensureGoogleAnalyticsScript() {
    if (!document.querySelector(SCRIPT_SELECTOR)) {
        const script = document.createElement('script')
        script.async = true
        script.src = GA_SRC
        script.setAttribute('data-ga-loader', 'deferred')
        document.head.appendChild(script)
    }

    if (!document.getElementById(INLINE_SCRIPT_ID)) {
        const inline = document.createElement('script')
        inline.id = INLINE_SCRIPT_ID
        inline.text = `
window.dataLayer = window.dataLayer || [];
function gtag(){dataLayer.push(arguments);}
gtag('js', new Date());
gtag('config', '${GA_ID}');
        `.trim()
        document.head.appendChild(inline)
    }
}

export function DeferredGoogleAnalyticsScript() {
    useEffect(() => {
        let loaded = false
        let timerId: ReturnType<typeof setTimeout> | null = null

        const cleanupListeners = () => {
            window.removeEventListener('pointerdown', loadScript)
            window.removeEventListener('keydown', loadScript)
            window.removeEventListener('touchstart', loadScript)
        }

        const loadScript = () => {
            if (loaded) {
                return
            }
            loaded = true
            cleanupListeners()
            ensureGoogleAnalyticsScript()
        }

        window.addEventListener('pointerdown', loadScript, { passive: true })
        window.addEventListener('keydown', loadScript)
        window.addEventListener('touchstart', loadScript, { passive: true })

        timerId = setTimeout(() => {
            loadScript()
        }, 8000)

        return () => {
            cleanupListeners()
            if (timerId !== null) {
                clearTimeout(timerId)
            }
        }
    }, [])

    return null
}
