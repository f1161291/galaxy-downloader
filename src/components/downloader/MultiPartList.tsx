import { Button } from '@/components/ui/button';
import { useDictionary } from '@/i18n/client';
import type { PageInfo } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

import { CollectionItemActions, type CollectionPreviewMediaType } from './CollectionItemActions';
import { canPreviewPageAudio, canPreviewPageVideo } from './media-preview';
import { LOAD_MORE_BATCH, useChunkedMobileList } from './use-chunked-mobile-list';
import { replaceTemplate } from './result-card-utils';
import { useTemporaryDownloadKeys } from './use-temporary-download-keys';

const DEFAULT_VISIBLE_PARTS = 100;

export function MultiPartList({
    pages,
    currentPage,
    onSelectPage,
}: {
    pages: PageInfo[];
    currentPage?: number;
    onSelectPage?: (page: number, mediaType: CollectionPreviewMediaType) => void;
}) {
    const dict = useDictionary();
    const { loadingKeys, triggerDownload } = useTemporaryDownloadKeys();
    const {
        canCollapseMobile,
        collapse,
        isMobile,
        loadMore,
        minimumVisibleCount,
        remainingCount,
        visibleItems: visiblePages,
    } = useChunkedMobileList(pages, Math.max(DEFAULT_VISIBLE_PARTS, currentPage || 1));

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-foreground/75">
                <span>
                    {replaceTemplate(dict.result.totalParts, '{count}', String(pages.length))}
                </span>
            </div>
            <div className="max-h-[min(56vh,26rem)] md:max-h-[min(60vh,32rem)] overflow-y-auto overscroll-contain pr-1">
                <div className="space-y-2 pr-2">
                    {visiblePages.map((page) => {
                        const displayTitle = page.part?.trim() || `P${page.page}`;
                        const videoKey = `${page.page}-video`;
                        const audioKey = `${page.page}-audio`;

                        return (
                            <div
                                key={page.page}
                                className={`flex w-full max-w-full flex-col gap-2 overflow-hidden rounded-lg border p-2 text-left transition-colors md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-2 md:p-3 ${
                                    page.page === currentPage
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:bg-muted/50'
                                }`}
                                style={{ contentVisibility: 'auto', containIntrinsicSize: 'auto 112px' }}
                            >
                                <div className="flex w-full items-start gap-2 min-w-0 overflow-hidden">
                                    <span className="text-xs font-medium text-foreground/70 shrink-0">
                                        P{page.page}
                                    </span>
                                    <div className="flex w-full items-center gap-2 flex-1 min-w-0 overflow-hidden">
                                        <div className="text-[13px] truncate min-w-0 flex-1 max-w-[64vw] sm:max-w-none" title={displayTitle}>
                                            {displayTitle}
                                        </div>
                                        <span className="text-xs text-foreground/65 shrink-0">
                                            {formatDuration(page.duration)}
                                        </span>
                                    </div>
                                </div>
                                <CollectionItemActions
                                    title={displayTitle}
                                    canPlayVideo={canPreviewPageVideo(page)}
                                    canPlayAudio={canPreviewPageAudio(page)}
                                    videoDownloadUrl={page.downloadVideoUrl}
                                    audioDownloadUrl={page.downloadAudioUrl}
                                    videoLoading={loadingKeys.has(videoKey)}
                                    audioLoading={loadingKeys.has(audioKey)}
                                    onPlay={(mediaType) => onSelectPage?.(page.page, mediaType)}
                                    onDownloadVideo={(url) => triggerDownload(url, videoKey)}
                                    onDownloadAudio={(url) => triggerDownload(url, audioKey)}
                                />
                            </div>
                        );
                    })}
                    {isMobile && (remainingCount > 0 || canCollapseMobile) && (
                        <div className="rounded-lg border border-border/70 p-2">
                            {remainingCount > 0 ? (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-8 w-full text-xs"
                                    onClick={loadMore}
                                >
                                    {replaceTemplate(
                                        dict.result.loadMoreItems,
                                        '{count}',
                                        String(Math.min(LOAD_MORE_BATCH, remainingCount))
                                    )}
                                </Button>
                            ) : (
                                <Button
                                    type="button"
                                    variant="outline"
                                    className="h-8 w-full text-xs"
                                    onClick={collapse}
                                >
                                    {replaceTemplate(dict.result.collapseParts, '{count}', String(minimumVisibleCount))}
                                </Button>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
