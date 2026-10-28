'use client'

import { useEffect, useState } from 'react'
import dynamic from 'next/dynamic'
import { AD_MIN_HEIGHT } from '@/lib/constants'

const SideRailAd = dynamic(
    () => import('@/components/ads/side-rail-ad').then((m) => m.SideRailAd),
    { ssr: false }
)

interface ViewportSideRailAdProps {
    slot: string
    showOn: 'desktop' | 'mobile'
    className?: string
    minHeight?: number
    height?: number
}

export function ViewportSideRailAd({
    slot,
    showOn,
    className,
    minHeight = AD_MIN_HEIGHT,
    height,
}: ViewportSideRailAdProps) {
    const [isDesktopViewport, setIsDesktopViewport] = useState<boolean | null>(null)

    useEffect(() => {
        const mediaQuery = window.matchMedia('(min-width: 1024px)')
        const updateViewport = () => setIsDesktopViewport(mediaQuery.matches)

        updateViewport()
        mediaQuery.addEventListener('change', updateViewport)

        return () => {
            mediaQuery.removeEventListener('change', updateViewport)
        }
    }, [])

    if (isDesktopViewport === null) {
        return <div className={className} style={{ minHeight: `${height ?? minHeight}px` }} />
    }

    const shouldRender = showOn === 'desktop' ? isDesktopViewport : !isDesktopViewport
    if (!shouldRender) {
        return null
    }

    return <SideRailAd slot={slot} className={className} minHeight={minHeight} height={height} />
}
