import { skipToken, useQuery } from '@tanstack/react-query';
import { getYouTubeVideoInfo } from '@/lib/youtube';

export const youtubeKeys = {
  all: ['youtube'] as const,
  videoInfo: (videoId: string | null) =>
    [...youtubeKeys.all, 'video-info', videoId] as const,
};

// Keyed by videoId so a late response for an earlier id never overwrites the current one.
export const useYouTubeVideoInfo = (videoId: string | null) =>
  useQuery({
    queryKey: youtubeKeys.videoInfo(videoId),
    queryFn: videoId ? () => getYouTubeVideoInfo(videoId) : skipToken,
    staleTime: Number.POSITIVE_INFINITY,
    retry: false,
  });
