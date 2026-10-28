'use client'

import { useEffect } from 'react'

const ADSENSE_SRC = 'https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-1581472267398547'
const SCRIPT_SELECTOR = 'script[data-adsense-loader="deferred"]'
const AD_SLOT_SELECTOR = 'ins.adsbygoogle[data-ad-client]'

function ensureAdSenseScript() {
    if (document.querySelector(SCRIPT_SELECTOR)) {
        return
    }

    const script = document.createElement('script')
    script.async = true
    script.crossOrigin = 'anonymous'
    script.src = ADSENSE_SRC
    script.setAttribute('data-adsense-loader', 'deferred')
    document.head.appendChild(script)
}

export function DeferredAdSenseScript() {
    useEffect(() => {
        let observer: IntersectionObserver | null = null
        let mutationObserver: MutationObserver | null = null
        let timerId: ReturnType<typeof setTimeout> | null = null
        let loaded = false

        const cleanupListeners = () => {
            window.removeEventListener('pointerdown', loadScript)
            window.removeEventListener('keydown', loadScript)
            window.removeEventListener('touchstart', loadScript)
        }

        const cleanupObservers = () => {
            observer?.disconnect()
            observer = null
            mutationObserver?.disconnect()
            mutationObserver = null
        }

        const loadScript = () => {
            if (loaded) {
                return
            }

            loaded = true
            cleanupListeners()
            cleanupObservers()
            ensureAdSenseScript()
        }

        const observeAdSlots = () => {
            if (loaded) {
                return
            }

            observer?.disconnect()
            observer = new IntersectionObserver((entries) => {
                if (entries.some((entry) => entry.isIntersecting)) {
                    loadScript()
                }
            }, { rootMargin: '256px 0px' })

            const adSlots = document.querySelectorAll<HTMLElement>(AD_SLOT_SELECTOR)
            adSlots.forEach((slot) => observer?.observe(slot))
        }

        window.addEventListener('pointerdown', loadScript, { passive: true })
        window.addEventListener('keydown', loadScript)
        window.addEventListener('touchstart', loadScript, { passive: true })

        observeAdSlots()
        mutationObserver = new MutationObserver(() => {
            if (!loaded) {
                observeAdSlots()
            }
        })
        mutationObserver.observe(document.body, { childList: true, subtree: true })

        timerId = setTimeout(() => {
            loadScript()
        }, 12000)

        return () => {
            cleanupListeners()
            cleanupObservers()
            if (timerId !== null) {
                clearTimeout(timerId)
            }
        }
    }, [])

    return null
}
