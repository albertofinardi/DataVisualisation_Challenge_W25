import { useState, useEffect, useCallback } from 'react';

export interface UsePlaybackReturn {
  currentTimeIndex: number;
  isPlaying: boolean;
  playbackSpeed: number;
  setCurrentTimeIndex: (index: number | ((prev: number) => number)) => void;
  setPlaybackSpeed: (speed: number) => void;
  play: () => void;
  pause: () => void;
  togglePlayPause: () => void;
  reset: () => void;
  next: () => void;
  previous: () => void;
  goToFrame: (index: number) => void;
}

/**
 * Custom hook for managing playback controls for temporal data
 *
 * @param totalFrames - Total number of frames to play
 * @param baseInterval - Base interval in milliseconds (default 1000ms = 1 second per frame at 1x speed)
 */
export function usePlayback(
  totalFrames: number,
  baseInterval: number = 1000
): UsePlaybackReturn {
  const [currentTimeIndex, setCurrentTimeIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(4); // Speed multiplier (1x = normal, 2x = double speed)

  /**
   * Auto-play animation effect
   * Converts speed multiplier to interval: higher speed = shorter interval
   */
  useEffect(() => {
    if (!isPlaying || totalFrames === 0) return;

    // Convert speed multiplier to interval (e.g., 2x speed = half the interval)
    const interval = baseInterval / playbackSpeed;

    const timer = setInterval(() => {
      setCurrentTimeIndex((prev) => {
        // Stop at the end
        if (prev >= totalFrames - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, interval);

    return () => clearInterval(timer);
  }, [isPlaying, totalFrames, playbackSpeed, baseInterval]);

  /**
   * Starts playback
   */
  const play = useCallback(() => {
    // If at the end, reset to beginning
    if (currentTimeIndex >= totalFrames - 1) {
      setCurrentTimeIndex(0);
    }
    setIsPlaying(true);
  }, [currentTimeIndex, totalFrames]);

  /**
   * Pauses playback
   */
  const pause = useCallback(() => {
    setIsPlaying(false);
  }, []);

  /**
   * Toggles play/pause
   */
  const togglePlayPause = useCallback(() => {
    if (isPlaying) {
      pause();
    } else {
      play();
    }
  }, [isPlaying, play, pause]);

  /**
   * Resets to the beginning
   */
  const reset = useCallback(() => {
    setCurrentTimeIndex(0);
    setIsPlaying(false);
  }, []);

  /**
   * Goes to the next frame
   */
  const next = useCallback(() => {
    setCurrentTimeIndex((prev) => Math.min(totalFrames - 1, prev + 1));
    setIsPlaying(false);
  }, [totalFrames]);

  /**
   * Goes to the previous frame
   */
  const previous = useCallback(() => {
    setCurrentTimeIndex((prev) => Math.max(0, prev - 1));
    setIsPlaying(false);
  }, []);

  /**
   * Goes to a specific frame
   */
  const goToFrame = useCallback(
    (index: number) => {
      setCurrentTimeIndex(Math.max(0, Math.min(totalFrames - 1, index)));
      setIsPlaying(false);
    },
    [totalFrames]
  );

  return {
    currentTimeIndex,
    isPlaying,
    playbackSpeed,
    setCurrentTimeIndex,
    setPlaybackSpeed,
    play,
    pause,
    togglePlayPause,
    reset,
    next,
    previous,
    goToFrame,
  };
}
