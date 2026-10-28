'use client'

import { useEffect, useState, type ComponentType } from 'react'

type ToasterComponent = ComponentType<Record<string, never>>

export function DeferredToaster() {
    const [Toaster, setToaster] = useState<ToasterComponent | null>(null)

    useEffect(() => {
        let cancelled = false
        let timerId: ReturnType<typeof setTimeout> | null = null
        let idleId: number | null = null

        const loadToaster = async () => {
            try {
                const mod = await import('@/components/ui/sonner')
                if (!cancelled) {
                    setToaster(() => mod.Toaster as ToasterComponent)
                }
            } catch {
                // Ignore toaster load failures to keep core flows unaffected.
            }
        }

        if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
            idleId = window.requestIdleCallback(() => {
                void loadToaster()
            }, { timeout: 2000 })
        } else {
            timerId = setTimeout(() => {
                void loadToaster()
            }, 1000)
        }

        return () => {
            cancelled = true
            if (idleId !== null && 'cancelIdleCallback' in window) {
                window.cancelIdleCallback(idleId)
            }
            if (timerId !== null) {
                clearTimeout(timerId)
            }
        }
    }, [])

    if (!Toaster) {
        return null
    }

    return <Toaster />
}
