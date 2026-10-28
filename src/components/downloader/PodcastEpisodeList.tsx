import { useEffect, useMemo, useRef, useState } from 'react';
import { Headphones } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useDictionary } from '@/i18n/client';
import type { PodcastEpisodeInfo } from '@/lib/types';
import { formatDuration } from '@/lib/utils';

import { AudioDownloadIcon } from './CustomIcons';
import { MediaActionIconButton } from './MediaActionIconButton';
import { replaceTemplate } from './result-card-utils';
import { LOAD_MORE_BATCH, useChunkedMobileList } from './use-chunked-mobile-list';
import { useTemporaryDownloadKeys } from './use-temporary-download-keys';

const DEFAULT_VISIBLE_EPISODES = 100;

export function PodcastEpisodeList({
    episodes,
    currentEpisodeId,
    autoScrollKey,
    autoScrollEpisodeId,
    onSelectEpisode,
}: {
    episodes: PodcastEpisodeInfo[];
    currentEpisodeId?: string;
    autoScrollKey?: string;
    autoScrollEpisodeId?: string;
    onSelectEpisode?: (episodeId: string) => void;
}) {
    const dict = useDictionary();
    const { loadingKeys, triggerDownload } = useTemporaryDownloadKeys();
    const [searchQuery, setSearchQuery] = useState('');
    const containerRef = useRef<HTMLDivElement | null>(null);
    const itemRefs = useRef(new Map<string, HTMLDivElement>());
    const lastAutoScrolledKeyRef = useRef<string | null>(null);
    const normalizedQuery = searchQuery.trim().toLowerCase();
    const filteredEpisodes = normalizedQuery
        ? episodes.filter((episode) => episode.title.toLowerCase().includes(normalizedQuery))
        : episodes;
    const autoScrollIndex = useMemo(
        () => filteredEpisodes.findIndex((episode) => episode.id === autoScrollEpisodeId),
        [autoScrollEpisodeId, filteredEpisodes]
    );
    const {
        canCollapseMobile,
        collapse,
        isMobile,
        loadMore,
        minimumVisibleCount,
        remainingCount,
        setMobileVisibleCount,
        visibleItems: visibleEpisodes,
    } = useChunkedMobileList(
        filteredEpisodes,
        autoScrollIndex >= 0 ? Math.max(DEFAULT_VISIBLE_EPISODES, autoScrollIndex + 1) : DEFAULT_VISIBLE_EPISODES
    );

    useEffect(() => {
        if (autoScrollIndex < 0) return;
        setMobileVisibleCount((previous) => Math.max(previous, autoScrollIndex + 1));
    }, [autoScrollIndex, setMobileVisibleCount]);

    useEffect(() => {
        if (!autoScrollKey || !autoScrollEpisodeId || lastAutoScrolledKeyRef.current === autoScrollKey) return;
        const element = itemRefs.current.get(autoScrollEpisodeId);
        const container = containerRef.current;
        if (!element || !container) return;
        const containerRect = container.getBoundingClientRect();
        const elementRect = element.getBoundingClientRect();
        if (elementRect.top < containerRect.top) {
            container.scrollTop += elementRect.top - containerRect.top;
        } else if (elementRect.bottom > containerRect.bottom) {
            container.scrollTop += elementRect.bottom - containerRect.bottom;
        }
        lastAutoScrolledKeyRef.current = autoScrollKey;
    }, [autoScrollEpisodeId, autoScrollKey, visibleEpisodes.length]);

    return (
        <div className="space-y-2">
            <div className="flex items-center justify-between gap-2 text-xs text-foreground/75">
                <div className="min-w-0">
                    <h3 className="font-medium">{dict.result.episodeList}</h3>
                    <span>{replaceTemplate(dict.result.episodeCount, '{count}', String(filteredEpisodes.length))}</span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                    <Input
                        value={searchQuery}
                        onChange={(event) => {
                            setSearchQuery(event.target.value);
                            setMobileVisibleCount(minimumVisibleCount);
                        }}
                        placeholder={dict.result.episodeSearchPlaceholder}
                        aria-label={dict.result.episodeSearchPlaceholder}
                        className="w-32 sm:w-56 h-8"
                    />
                </div>
            </div>
            <div
                ref={containerRef}
                className="max-h-[min(56vh,26rem)] md:max-h-[min(60vh,32rem)] overflow-y-auto overscroll-contain pr-1"
            >
                <div className="space-y-2 pr-2">
                    {filteredEpisodes.length === 0 && (
                        <p className="py-6 text-center text-sm text-muted-foreground">
                            {dict.result.episodeNoSearchResults}
                        </p>
                    )}
                    {visibleEpisodes.map((episode, index) => {
                        const audioUrl = episode.downloadAudioUrl || episode.originDownloadAudioUrl || null;
                        const downloadKey = `${episode.id}-audio`;
                        const isCurrentItem = Boolean(currentEpisodeId) && episode.id === currentEpisodeId;

                        return (
                            <div
                                key={episode.id}
                                ref={(element) => {
                                    if (element) {
                                        itemRefs.current.set(episode.id, element);
                                    } else {
                                        itemRefs.current.delete(episode.id);
                                    }
                                }}
                                className={`flex w-full max-w-full flex-col gap-2 overflow-hidden rounded-lg border p-2 text-left transition-colors md:grid md:grid-cols-[minmax(0,1fr)_auto] md:items-center md:gap-2 md:p-3 ${
                                    isCurrentItem
                                        ? 'border-primary bg-primary/5'
                                        : 'border-border hover:bg-muted/50'
                                }`}
                            >
                                <div className="flex w-full items-start gap-2 min-w-0 overflow-hidden">
                                    <span className="text-xs font-medium text-foreground/70 shrink-0">
                                        {index + 1}
                                    </span>
                                    <div className="flex w-full flex-col gap-0.5 flex-1 min-w-0 overflow-hidden">
                                        <div
                                            className="text-[13px] truncate min-w-0 max-w-[64vw] sm:max-w-none"
                                            title={episode.title}
                                        >
                                            {episode.title}
                                        </div>
                                        <div className="flex items-center gap-2 text-xs text-foreground/60">
                                            {episode.duration != null && (
                                                <span>{formatDuration(episode.duration)}</span>
                                            )}
                                            {episode.releaseDate && (
                                                <span>{episode.releaseDate}</span>
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="w-full space-y-2 md:min-w-[11rem] md:shrink-0">
                                    <div className="grid grid-cols-1 gap-2">
                                        <MediaActionIconButton
                                            label={`${dict.result.playAudio}: ${episode.title}`}
                                            text={dict.result.playAudio}
                                            icon={Headphones}
                                            variant="secondary"
                                            disabled={isCurrentItem}
                                            className="w-full"
                                            onClick={() => onSelectEpisode?.(episode.id)}
                                        />
                                    </div>
                                    {audioUrl && (
                                        <div className="grid grid-cols-1 gap-2">
                                            <MediaActionIconButton
                                                label={dict.result.downloadAudio}
                                                icon={AudioDownloadIcon}
                                                variant="default"
                                                disabled={loadingKeys.has(downloadKey)}
                                                loading={loadingKeys.has(downloadKey)}
                                                className="w-full"
                                                onClick={() => triggerDownload(audioUrl, downloadKey)}
                                            />
                                        </div>
                                    )}
                                </div>
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
