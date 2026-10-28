'use client';

import { useState, useCallback, useRef, useEffect } from 'react';
import { terminateFFmpeg, type FFmpegStage, type ProgressInfo } from '@/lib/ffmpeg';
import { sanitizeFilename } from '@/lib/utils';

export type FFmpegStatus =
  | 'idle'
  | 'loading'
  | 'downloading'
  | 'converting'
  | 'reading-video'
  | 'reading-audio'
  | 'merging'
  | 'completed'
  | 'error';

export interface UseFFmpegReturn {
  status: FFmpegStatus;
  progress: number;
  progressInfo: ProgressInfo | null;
  error: string | null;
  extractAudio: (videoUrl: string, title: string) => Promise<void>;
  extractAudioFromFile: (file: File, title?: string) => Promise<void>;
  mergeVideoAndAudio: (videoFile: File, audioFile: File, title?: string) => Promise<void>;
  reset: () => void;
  cancel: () => void;
}

export function useFFmpeg(): UseFFmpegReturn {
  const [status, setStatus] = useState<FFmpegStatus>('idle');
  const [progress, setProgress] = useState(0);
  const [progressInfo, setProgressInfo] = useState<ProgressInfo | null>(null);
  const [error, setError] = useState<string | null>(null);
  const activeTaskIdRef = useRef(0);
  const activeAbortControllerRef = useRef<AbortController | null>(null);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearCompletionTimer = useCallback(() => {
    if (completionTimerRef.current) {
      clearTimeout(completionTimerRef.current);
      completionTimerRef.current = null;
    }
  }, []);

  const clearViewState = useCallback(() => {
    setStatus('idle');
    setProgress(0);
    setProgressInfo(null);
    setError(null);
  }, []);

  const isTaskActive = useCallback((taskId: number) => activeTaskIdRef.current === taskId, []);

  const applyIfActive = useCallback((taskId: number, update: () => void) => {
    if (!isTaskActive(taskId)) {
      return false;
    }

    update();
    return true;
  }, [isTaskActive]);

  const invalidateActiveTask = useCallback(() => {
    activeTaskIdRef.current += 1;
    activeAbortControllerRef.current?.abort();
    activeAbortControllerRef.current = null;
    clearCompletionTimer();
  }, [clearCompletionTimer]);

  const beginTask = useCallback(() => {
    invalidateActiveTask();
    const taskId = activeTaskIdRef.current;
    const abortController = new AbortController();

    activeAbortControllerRef.current = abortController;
    clearViewState();
    setStatus('loading');
    setProgress(5);

    return {
      taskId,
      signal: abortController.signal,
    };
  }, [clearViewState, invalidateActiveTask]);

  const completeWithReset = useCallback((taskId: number) => {
    if (!applyIfActive(taskId, () => {
      activeAbortControllerRef.current = null;
      setStatus('completed');
    })) {
      return;
    }

    clearCompletionTimer();
    completionTimerRef.current = setTimeout(() => {
      applyIfActive(taskId, () => {
        activeAbortControllerRef.current = null;
        clearViewState();
      });
    }, 2000);
  }, [applyIfActive, clearCompletionTimer, clearViewState]);

  const cancel = useCallback(() => {
    invalidateActiveTask();
    terminateFFmpeg();

    clearViewState();
  }, [clearViewState, invalidateActiveTask]);

  const reset = useCallback(() => {
    invalidateActiveTask();
    clearViewState();
  }, [clearViewState, invalidateActiveTask]);

  useEffect(() => () => {
    invalidateActiveTask();
    clearCompletionTimer();
    terminateFFmpeg();
  }, [clearCompletionTimer, invalidateActiveTask]);

  const extractAudio = useCallback(async (videoUrl: string, title: string) => {
    const { taskId, signal } = beginTask();

    try {
      const { extractAudioFromVideo, downloadBlob } = await import('@/lib/ffmpeg');

      const audioBlob = await extractAudioFromVideo({
        videoUrl,
        signal,
        onProgress: (prog: number, stage: FFmpegStage, info?: ProgressInfo) => {
          applyIfActive(taskId, () => {
            setStatus(stage);
            setProgress(prog);
            if (info) {
              setProgressInfo(info);
            }
          });
        },
      });

      if (!isTaskActive(taskId)) {
        return;
      }

      // Trigger download
      downloadBlob(audioBlob, `${sanitizeFilename(title)}.mp3`);
      completeWithReset(taskId);

    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      if (!isTaskActive(taskId)) {
        return;
      }

      console.error('Extract audio error:', err);
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'Unknown error');
    }
  }, [applyIfActive, beginTask, completeWithReset, isTaskActive]);

  const extractAudioFromFile = useCallback(async (file: File, title?: string) => {
    const { taskId, signal } = beginTask();

    try {
      const { extractAudioFromVideo, downloadBlob } = await import('@/lib/ffmpeg');

      const outputTitle = title || file.name.replace(/\.[^.]+$/, '') || 'output';

      const audioBlob = await extractAudioFromVideo({
        videoFile: file,
        signal,
        onProgress: (prog: number, stage: FFmpegStage, info?: ProgressInfo) => {
          applyIfActive(taskId, () => {
            setStatus(stage);
            setProgress(prog);
            if (info) {
              setProgressInfo(info);
            }
          });
        },
      });

      if (!isTaskActive(taskId)) {
        return;
      }

      // Trigger download
      downloadBlob(audioBlob, `${sanitizeFilename(outputTitle)}.mp3`);
      completeWithReset(taskId);

    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      if (!isTaskActive(taskId)) {
        return;
      }

      console.error('Extract audio from file error:', err);
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'Unknown error');
    }
  }, [applyIfActive, beginTask, completeWithReset, isTaskActive]);

  const mergeVideoAndAudio = useCallback(async (videoFile: File, audioFile: File, title?: string) => {
    const { taskId, signal } = beginTask();

    try {
      const { mergeVideoAudio, downloadBlob } = await import('@/lib/ffmpeg');
      const outputTitle = title || videoFile.name.replace(/\.[^.]+$/, '') || 'merged-video';

      const mergedBlob = await mergeVideoAudio({
        videoFile,
        audioFile,
        signal,
        onProgress: (prog: number, stage: FFmpegStage, info?: ProgressInfo) => {
          applyIfActive(taskId, () => {
            setStatus(stage);
            setProgress(prog);
            if (info) {
              setProgressInfo(info);
            }
          });
        },
      });

      if (!isTaskActive(taskId)) {
        return;
      }

      downloadBlob(mergedBlob, `${sanitizeFilename(outputTitle)}.mp4`);
      completeWithReset(taskId);
    } catch (err) {
      if (err instanceof DOMException && err.name === 'AbortError') {
        return;
      }

      if (!isTaskActive(taskId)) {
        return;
      }

      console.error('Merge video and audio error:', err);
      setStatus('error');
      const errorMessage = err instanceof Error ? err.message : String(err);
      setError(errorMessage || 'Unknown error');
    }
  }, [applyIfActive, beginTask, completeWithReset, isTaskActive]);

  return { status, progress, progressInfo, error, extractAudio, extractAudioFromFile, mergeVideoAndAudio, reset, cancel };
}
