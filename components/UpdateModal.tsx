import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useAppUpdates } from '../hooks/useAppUpdates';
import { UPDATE_CONFIG } from '../utils/updateConfig';

interface UpdateModalProps {
  visible: boolean;
  title: string;
  description: string;
  isForced: boolean;
  priority: 'low' | 'medium' | 'high' | 'critical';
  onUpdateNow: () => Promise<void>;
  onUpdateLater: () => void;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const UpdateModal: React.FC<UpdateModalProps> = ({
  visible,
  title,
  description,
  isForced,
  priority,
  onUpdateNow,
  onUpdateLater,
  onDismiss,
}) => {
  const { isDownloading, downloadProgress, isPending } = useAppUpdates();
  const [scaleAnim] = useState(new Animated.Value(0));
  const [opacityAnim] = useState(new Animated.Value(0));
  const [isUpdating, setIsUpdating] = useState(false);

  // 애니메이션 효과
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(opacityAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0,
          duration: 150,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, opacityAnim, scaleAnim]);

  // 우선순위에 따른 색상 설정
  const getPriorityColor = () => {
    switch (priority) {
      case 'critical':
        return '#ff4444';
      case 'high':
        return '#ff8800';
      case 'medium':
        return '#8B4513';
      case 'low':
        return '#666666';
      default:
        return '#8B4513';
    }
  };

  // 아이콘 설정
  const getIcon = () => {
    switch (priority) {
      case 'critical':
        return 'warning';
      case 'high':
        return 'star';
      case 'medium':
        return 'refresh';
      case 'low':
        return 'information-circle';
      default:
        return 'refresh';
    }
  };

  // 업데이트 시작 핸들러
  const handleUpdateNow = async () => {
    setIsUpdating(true);
    try {
      await onUpdateNow();
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setIsUpdating(false);
    }
  };

  // 배경 터치 핸들러
  const handleBackdropPress = () => {
    if (!(isForced || isUpdating)) {
      onDismiss();
    }
  };

  // 나중에 버튼 핸들러
  const handleUpdateLater = () => {
    if (!isUpdating) {
      onUpdateLater();
    }
  };

  // 닫기 버튼 핸들러
  const handleDismiss = () => {
    if (!(isForced || isUpdating)) {
      onDismiss();
    }
  };

  return (
    <Modal
      animationType="none"
      onRequestClose={handleDismiss}
      transparent
      visible={visible}
    >
      <Animated.View
        style={[
          styles.overlay,
          {
            opacity: opacityAnim,
          },
        ]}
      >
        <TouchableOpacity
          activeOpacity={1}
          onPress={handleBackdropPress}
          style={styles.backdrop}
        >
          <Animated.View
            style={[
              styles.modal,
              {
                transform: [{ scale: scaleAnim }],
              },
            ]}
          >
            <TouchableOpacity activeOpacity={1} onPress={() => {}}>
              {/* 헤더 */}
              <View style={styles.header}>
                <View
                  style={[
                    styles.iconContainer,
                    { backgroundColor: getPriorityColor() },
                  ]}
                >
                  <Ionicons color="white" name={getIcon()} size={24} />
                </View>

                {!isForced && (
                  <TouchableOpacity
                    disabled={isUpdating}
                    onPress={handleDismiss}
                    style={styles.closeButton}
                  >
                    <Ionicons color="#666" name="close" size={24} />
                  </TouchableOpacity>
                )}
              </View>

              {/* 콘텐츠 */}
              <View style={styles.content}>
                <Text style={styles.title}>{title}</Text>
                <Text style={styles.description}>{description}</Text>

                {/* 다운로드 진행률 */}
                {isDownloading && (
                  <View style={styles.progressContainer}>
                    <View style={styles.progressBar}>
                      <View
                        style={[
                          styles.progressFill,
                          {
                            width: `${downloadProgress}%`,
                            backgroundColor: getPriorityColor(),
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.progressText}>
                      {downloadProgress}% 다운로드 중...
                    </Text>
                  </View>
                )}

                {/* 업데이트 준비 완료 */}
                {isPending && (
                  <View style={styles.readyContainer}>
                    <Ionicons
                      color="#4CAF50"
                      name="checkmark-circle"
                      size={20}
                    />
                    <Text style={styles.readyText}>
                      {UPDATE_CONFIG.MESSAGES.READY_TO_RESTART}
                    </Text>
                  </View>
                )}
              </View>

              {/* 버튼 */}
              <View style={styles.buttonContainer}>
                {!isForced && (
                  <TouchableOpacity
                    disabled={isUpdating}
                    onPress={handleUpdateLater}
                    style={[
                      styles.button,
                      styles.laterButton,
                      isUpdating && styles.disabledButton,
                    ]}
                  >
                    <Text style={styles.laterButtonText}>나중에</Text>
                  </TouchableOpacity>
                )}

                <TouchableOpacity
                  disabled={isUpdating}
                  onPress={handleUpdateNow}
                  style={[
                    styles.button,
                    styles.updateButton,
                    { backgroundColor: getPriorityColor() },
                    isUpdating && styles.disabledButton,
                    !isForced && styles.flexButton,
                  ]}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="white" size="small" />
                  ) : (
                    <Text style={styles.updateButtonText}>
                      {isPending ? '지금 재시작' : '지금 업데이트'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </Animated.View>
        </TouchableOpacity>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  backdrop: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginHorizontal: 20,
    maxWidth: SCREEN_WIDTH - 40,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  content: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  description: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 16,
  },
  progressContainer: {
    marginTop: 16,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#e0e0e0',
    borderRadius: 2,
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  progressText: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  readyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f0f8f0',
    borderRadius: 8,
  },
  readyText: {
    fontSize: 14,
    color: '#2e7d32',
    marginLeft: 8,
    fontWeight: '600',
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 12,
  },
  button: {
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  laterButton: {
    backgroundColor: '#f0f0f0',
    flex: 1,
  },
  updateButton: {
    backgroundColor: '#8B4513',
  },
  flexButton: {
    flex: 1,
  },
  laterButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
  disabledButton: {
    opacity: 0.6,
  },
});
