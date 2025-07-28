import type React from 'react';
import { useEffect } from 'react';
import { Alert, AppState, type AppStateStatus } from 'react-native';
import { useUpdateNotification } from '../hooks/useUpdateNotification';
import { debugLog, isUpdateEnabled } from '../utils/updateConfig';
import { logUpdateEvent } from '../utils/updateHelpers';
import { UpdateModal } from './UpdateModal';
import { UpdateSnackbar } from './UpdateSnackbar';

export const UpdateManager: React.FC = () => {
  const {
    notification,
    onUpdateNow,
    onUpdateLater,
    onDismiss,
    shouldShowNotification,
  } = useUpdateNotification();

  // 앱 상태 변경 감지
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        debugLog('App became active, checking for updates...');
        logUpdateEvent('app_became_active');
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, []);

  // 업데이트 기능이 비활성화된 경우 아무것도 렌더링하지 않음
  if (!isUpdateEnabled()) {
    return null;
  }

  // 업데이트 에러 처리
  const handleUpdateError = (error: Error) => {
    debugLog('Update error occurred', error);

    Alert.alert(
      '업데이트 오류',
      '업데이트 중 문제가 발생했습니다. 잠시 후 다시 시도해주세요.',
      [
        { text: '확인', style: 'default' },
        { text: '다시 시도', onPress: onUpdateNow },
      ]
    );
  };

  // 업데이트 성공 처리
  const handleUpdateSuccess = () => {
    debugLog('Update completed successfully');
    logUpdateEvent('update_completed');
  };

  // 강화된 업데이트 핸들러
  const handleUpdateNowWithErrorHandling = async () => {
    try {
      await onUpdateNow();
      handleUpdateSuccess();
    } catch (error) {
      handleUpdateError(error as Error);
    }
  };

  // 알림이 표시되어야 할 조건이 아닌 경우
  if (!shouldShowNotification) {
    return null;
  }

  return (
    <>
      {/* 모달 알림 */}
      {notification.show && notification.type === 'modal' && (
        <UpdateModal
          description={notification.description}
          isForced={notification.isForced}
          onDismiss={onDismiss}
          onUpdateLater={onUpdateLater}
          onUpdateNow={handleUpdateNowWithErrorHandling}
          priority={notification.priority}
          title={notification.title}
          visible={notification.show}
        />
      )}

      {/* 스낵바 알림 */}
      {notification.show && notification.type === 'snackbar' && (
        <UpdateSnackbar
          description={notification.description}
          dismissible={notification.dismissible}
          onDismiss={onDismiss}
          onUpdateLater={onUpdateLater}
          onUpdateNow={handleUpdateNowWithErrorHandling}
          priority={notification.priority}
          title={notification.title}
          visible={notification.show}
        />
      )}
    </>
  );
};

export default UpdateManager;
