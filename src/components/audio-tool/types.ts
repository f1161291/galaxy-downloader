import type { MediaActions } from '@/lib/types'

export type ResultTaskAction = 'extract-audio' | 'merge-video'

export interface AudioExtractTask {
    action?: ResultTaskAction
    title?: string
    sourceUrl?: string | null
    audioUrl?: string | null
    videoUrl?: string | null
    mediaActions?: MediaActions
}

export type ExtractMode = 'file' | 'merge'

export type AudioToolStage =
    | 'idle'
    | 'parsing'
    | 'preparing-merge'
    | 'direct-downloading'
    | 'fallback-extracting'
    | 'reading-file'
    | 'completed'
    | 'error'
