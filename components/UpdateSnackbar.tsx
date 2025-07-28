import { Ionicons } from '@expo/vector-icons';
import type React from 'react';
import { useEffect, useState } from 'react';
import {
  Animated,
  Dimensions,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAppUpdates } from '../hooks/useAppUpdates';

interface UpdateSnackbarProps {
  visible: boolean;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'critical';
  dismissible: boolean;
  onUpdateNow: () => Promise<void>;
  onUpdateLater: () => void;
  onDismiss: () => void;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');

export const UpdateSnackbar: React.FC<UpdateSnackbarProps> = ({
  visible,
  title,
  description,
  priority,
  dismissible,
  onUpdateNow,
  onUpdateLater,
  onDismiss,
}) => {
  const insets = useSafeAreaInsets();
  const { isPending } = useAppUpdates();
  const [translateY] = useState(new Animated.Value(100));
  const [translateX] = useState(new Animated.Value(0));
  const [opacity] = useState(new Animated.Value(0));
  const [isUpdating, setIsUpdating] = useState(false);

  // 애니메이션 효과
  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(translateY, {
          toValue: 100,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, translateY, opacity]);

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
    if (isPending) {
      return 'checkmark-circle';
    }

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

  // 스와이프 제스처 핸들러
  const handleGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: true }
  );

  const handleStateChange = (event: any) => {
    if (event.nativeEvent.state === State.END) {
      const { translationX, velocityX } = event.nativeEvent;

      // 스와이프 거리나 속도가 충분하면 닫기
      if (
        Math.abs(translationX) > SCREEN_WIDTH * 0.3 ||
        Math.abs(velocityX) > 1000
      ) {
        if (dismissible) {
          Animated.timing(translateX, {
            toValue: translationX > 0 ? SCREEN_WIDTH : -SCREEN_WIDTH,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            onDismiss();
            translateX.setValue(0);
          });
        } else {
          // 닫을 수 없는 경우 원래 위치로 복귀
          Animated.spring(translateX, {
            toValue: 0,
            tension: 100,
            friction: 8,
            useNativeDriver: true,
          }).start();
        }
      } else {
        // 스와이프 거리가 충분하지 않으면 원래 위치로 복귀
        Animated.spring(translateX, {
          toValue: 0,
          tension: 100,
          friction: 8,
          useNativeDriver: true,
        }).start();
      }
    }
  };

  if (!visible) {
    return null;
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          bottom: insets.bottom + 20,
          opacity,
          transform: [{ translateY }, { translateX }],
        },
      ]}
    >
      <PanGestureHandler
        onGestureEvent={handleGestureEvent}
        onHandlerStateChange={handleStateChange}
      >
        <Animated.View
          style={[styles.snackbar, { borderLeftColor: getPriorityColor() }]}
        >
          {/* 아이콘 */}
          <View
            style={[
              styles.iconContainer,
              { backgroundColor: getPriorityColor() },
            ]}
          >
            <Ionicons color="white" name={getIcon()} size={20} />
          </View>

          {/* 콘텐츠 */}
          <View style={styles.content}>
            <Text numberOfLines={1} style={styles.title}>
              {title}
            </Text>
            <Text numberOfLines={2} style={styles.description}>
              {description}
            </Text>
          </View>

          {/* 액션 버튼 */}
          <View style={styles.actions}>
            <TouchableOpacity
              disabled={isUpdating}
              onPress={handleUpdateNow}
              style={[
                styles.actionButton,
                { backgroundColor: getPriorityColor() },
              ]}
            >
              <Text style={styles.actionButtonText}>
                {isPending ? '재시작' : '업데이트'}
              </Text>
            </TouchableOpacity>

            {dismissible && (
              <TouchableOpacity
                disabled={isUpdating}
                onPress={onDismiss}
                style={styles.dismissButton}
              >
                <Ionicons color="#666" name="close" size={16} />
              </TouchableOpacity>
            )}
          </View>

          {/* 스와이프 인디케이터 */}
          {dismissible && (
            <View style={styles.swipeIndicator}>
              <View style={styles.swipeHandle} />
            </View>
          )}
        </Animated.View>
      </PanGestureHandler>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 1000,
  },
  snackbar: {
    backgroundColor: 'white',
    borderRadius: 12,
    borderLeftWidth: 4,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 8,
  },
  iconContainer: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  content: {
    flex: 1,
    marginRight: 8,
  },
  title: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 2,
  },
  description: {
    fontSize: 12,
    color: '#666',
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: 'white',
  },
  dismissButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
  },
  swipeIndicator: {
    position: 'absolute',
    top: 4,
    left: '50%',
    transform: [{ translateX: -12 }],
  },
  swipeHandle: {
    width: 24,
    height: 3,
    backgroundColor: '#ddd',
    borderRadius: 1.5,
  },
});

export default UpdateSnackbar;
