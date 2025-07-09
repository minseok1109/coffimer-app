import React, { useEffect } from 'react';
import { Alert, AppState, AppStateStatus } from 'react-native';
import { useUpdateNotification } from '../hooks/useUpdateNotification';
import { UpdateModal } from './UpdateModal';
import { UpdateSnackbar } from './UpdateSnackbar';
import { isUpdateEnabled, debugLog } from '../utils/updateConfig';
import { logUpdateEvent } from '../utils/updateHelpers';

export const UpdateManager: React.FC = () => {
  const {
    notification,
    onUpdateNow,
    onUpdateLater,
    onDismiss,
    shouldShowNotification,
  } = useUpdateNotification();
  
  // 업데이트 기능이 비활성화된 경우 아무것도 렌더링하지 않음
  if (!isUpdateEnabled()) {
    return null;
  }
  
  // 앱 상태 변경 감지
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active') {
        debugLog('App became active, checking for updates...');
        logUpdateEvent('app_became_active');
      }
    };
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    return () => subscription?.remove();
  }, []);
  
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
          visible={notification.show}
          title={notification.title}
          description={notification.description}
          isForced={notification.isForced}
          priority={notification.priority}
          onUpdateNow={handleUpdateNowWithErrorHandling}
          onUpdateLater={onUpdateLater}
          onDismiss={onDismiss}
        />
      )}
      
      {/* 스낵바 알림 */}
      {notification.show && notification.type === 'snackbar' && (
        <UpdateSnackbar
          visible={notification.show}
          title={notification.title}
          description={notification.description}
          priority={notification.priority}
          dismissible={notification.dismissible}
          onUpdateNow={handleUpdateNowWithErrorHandling}
          onUpdateLater={onUpdateLater}
          onDismiss={onDismiss}
        />
      )}
    </>
  );
};

export default UpdateManager;