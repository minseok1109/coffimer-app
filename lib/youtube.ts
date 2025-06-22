/**
 * YouTube URL validation and utility functions
 */

/**
 * Validates if a URL is a valid YouTube URL
 */
export const isValidYouTubeUrl = (url: string): boolean => {
  if (!url || url.trim() === '') return false;
  
  const youtubeRegex = /^(https?:\/\/)?(www\.)?(youtube\.com\/(watch\?v=|embed\/|v\/)|youtu\.be\/)[\w-]+/i;
  return youtubeRegex.test(url);
};

/**
 * Extracts YouTube video ID from various YouTube URL formats
 */
export const extractYouTubeVideoId = (url: string): string | null => {
  if (!isValidYouTubeUrl(url)) return null;
  
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)/,
    /youtube\.com\/v\/([^&\n?#]+)/
  ];
  
  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  
  return null;
};

/**
 * Generates YouTube thumbnail URL from video ID
 */
export const getYouTubeThumbnail = (videoId: string): string => {
  return `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`;
};

/**
 * Gets YouTube video title and thumbnail info
 */
export const getYouTubeVideoInfo = async (videoId: string) => {
  try {
    // Using YouTube oEmbed API for basic video info
    const response = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
    
    if (!response.ok) {
      throw new Error('Video not found');
    }
    
    const data = await response.json();
    
    return {
      title: data.title,
      thumbnail: data.thumbnail_url,
      author: data.author_name,
    };
  } catch (error) {
    console.error('Error fetching YouTube video info:', error);
    return null;
  }
};