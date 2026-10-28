'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

const DISMISSED_KEY = 'pwa-install-dismissed'

interface BeforeInstallPromptEvent extends Event {
    prompt(): Promise<{ outcome: 'accepted' | 'dismissed' }>
}

function readDismissedFlag(): boolean {
    try {
        return window.localStorage.getItem(DISMISSED_KEY) === '1'
    } catch {
        return false
    }
}

function writeDismissedFlag(): void {
    try {
        window.localStorage.setItem(DISMISSED_KEY, '1')
    } catch {
        // Ignore storage access failures in restricted contexts.
    }
}

export function useInstallPrompt() {
    const deferredEvent = useRef<BeforeInstallPromptEvent | null>(null)
    const [canPrompt, setCanPrompt] = useState(false)

    useEffect(() => {
        if (window.matchMedia('(display-mode: standalone)').matches) return
        if (readDismissedFlag()) return

        const handleBeforeInstall = (e: Event) => {
            e.preventDefault()
            deferredEvent.current = e as BeforeInstallPromptEvent
            setCanPrompt(true)
        }

        const handleAppInstalled = () => {
            deferredEvent.current = null
            setCanPrompt(false)
        }

        window.addEventListener('beforeinstallprompt', handleBeforeInstall)
        window.addEventListener('appinstalled', handleAppInstalled)

        return () => {
            window.removeEventListener('beforeinstallprompt', handleBeforeInstall)
            window.removeEventListener('appinstalled', handleAppInstalled)
        }
    }, [])

    const promptInstall = useCallback(async () => {
        if (!deferredEvent.current) return
        await deferredEvent.current.prompt()
        deferredEvent.current = null
        setCanPrompt(false)
    }, [])

    const dismiss = useCallback(() => {
        writeDismissedFlag()
        setCanPrompt(false)
    }, [])

    return { canPrompt, promptInstall, dismiss }
}
