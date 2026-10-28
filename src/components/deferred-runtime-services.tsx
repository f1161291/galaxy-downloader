'use client'

import dynamic from 'next/dynamic'

const RuntimeServices = dynamic(
    () => import('@/components/runtime-services').then((m) => m.RuntimeServices),
    { ssr: false }
)

export function DeferredRuntimeServices() {
    return <RuntimeServices />
}
