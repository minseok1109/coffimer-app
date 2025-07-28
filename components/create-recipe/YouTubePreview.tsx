import type React from 'react';
import { useEffect, useState } from 'react';
import {
  Image,
  Linking,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { extractYouTubeVideoId, getYouTubeVideoInfo } from '@/lib/youtube';

interface YouTubePreviewProps {
  url: string;
}

interface VideoInfo {
  title: string;
  thumbnail: string;
  author: string;
}

export const YouTubePreview: React.FC<YouTubePreviewProps> = ({ url }) => {
  const [videoInfo, setVideoInfo] = useState<VideoInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(false);

  useEffect(() => {
    const fetchVideoInfo = async () => {
      if (!url) {
        setVideoInfo(null);
        return;
      }

      const videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        setError(true);
        return;
      }

      setLoading(true);
      setError(false);

      try {
        const info = await getYouTubeVideoInfo(videoId);
        if (info) {
          setVideoInfo(info);
        } else {
          setError(true);
        }
      } catch (err) {
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchVideoInfo();
  }, [url]);

  const handlePress = () => {
    if (url) {
      Linking.openURL(url);
    }
  };

  if (!(url && (loading || videoInfo || error))) {
    return null;
  }

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>영상 정보를 불러오는 중...</Text>
        </View>
      </View>
    );
  }

  if (error || !videoInfo) {
    return (
      <View style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>
            올바른 YouTube URL을 입력해주세요
          </Text>
        </View>
      </View>
    );
  }

  return (
    <TouchableOpacity onPress={handlePress} style={styles.container}>
      <View style={styles.previewContainer}>
        <Image
          resizeMode="cover"
          source={{ uri: videoInfo.thumbnail }}
          style={styles.thumbnail}
        />
        <View style={styles.overlay}>
          <View style={styles.playButton}>
            <Text style={styles.playButtonText}>▶</Text>
          </View>
        </View>
        <View style={styles.infoContainer}>
          <Text numberOfLines={2} style={styles.title}>
            {videoInfo.title}
          </Text>
          <Text numberOfLines={1} style={styles.author}>
            {videoInfo.author}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    marginTop: 12,
  },
  previewContainer: {
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  thumbnail: {
    width: '100%',
    height: 180,
    backgroundColor: '#e9ecef',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButton: {
    width: 60,
    height: 60,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },
  playButtonText: {
    color: 'white',
    fontSize: 24,
    marginLeft: 4,
  },
  infoContainer: {
    padding: 12,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 4,
  },
  author: {
    fontSize: 14,
    color: '#666',
  },
  loadingContainer: {
    padding: 20,
    alignItems: 'center',
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e9ecef',
  },
  loadingText: {
    color: '#666',
    fontSize: 14,
  },
  errorContainer: {
    padding: 16,
    backgroundColor: '#fff5f5',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#fed7d7',
  },
  errorText: {
    color: '#c53030',
    fontSize: 14,
    textAlign: 'center',
  },
});
