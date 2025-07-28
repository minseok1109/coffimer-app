import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useState } from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import {
  debugLog,
  UPDATE_CONFIG,
  type UpdateMetadata,
  type UpdatePriority,
} from '../utils/updateConfig';
import {
  getUpdateMessage,
  getUserSettings,
  logUpdateEvent,
} from '../utils/updateHelpers';
import { useAppUpdates } from './useAppUpdates';

// 알림 타입
export type NotificationType = 'modal' | 'snackbar' | 'none';

// 알림 상태 인터페이스
interface NotificationState {
  show: boolean;
  type: NotificationType;
  title: string;
  description: string;
  isForced: boolean;
  priority: UpdatePriority;
  dismissible: boolean;
  autoDismiss: boolean;
}

interface UseUpdateNotificationReturn {
  // 알림 상태
  notification: NotificationState;

  // 알림 액션
  showNotification: (type: NotificationType, metadata?: UpdateMetadata) => void;
  hideNotification: () => void;

  // 사용자 액션
  onUpdateNow: () => Promise<void>;
  onUpdateLater: () => void;
  onDismiss: () => void;

  // 설정
  shouldShowNotification: boolean;
  notificationCount: number;
}

const DISMISSED_UPDATES_KEY = 'dismissed_updates';
const NOTIFICATION_COUNT_KEY = 'notification_count';

export const useUpdateNotification = (): UseUpdateNotificationReturn => {
  const {
    status,
    isUpdateAvailable,
    isPending,
    updateInfo,
    downloadUpdate,
    applyUpdate,
    dismissUpdate,
    error,
  } = useAppUpdates();

  const [notification, setNotification] = useState<NotificationState>({
    show: false,
    type: 'none',
    title: '',
    description: '',
    isForced: false,
    priority: 'medium',
    dismissible: true,
    autoDismiss: false,
  });

  const [dismissedUpdates, setDismissedUpdates] = useState<Set<string>>(
    new Set()
  );
  const [notificationCount, setNotificationCount] = useState(0);
  const [shouldShowNotification, setShouldShowNotification] = useState(false);

  // 무시된 업데이트 로드
  useEffect(() => {
    const loadDismissedUpdates = async () => {
      try {
        const dismissed = await AsyncStorage.getItem(DISMISSED_UPDATES_KEY);
        if (dismissed) {
          setDismissedUpdates(new Set(JSON.parse(dismissed)));
        }
      } catch (error) {
        debugLog('Failed to load dismissed updates', error);
      }
    };

    loadDismissedUpdates();
  }, []);

  // 알림 횟수 로드
  useEffect(() => {
    const loadNotificationCount = async () => {
      try {
        const count = await AsyncStorage.getItem(NOTIFICATION_COUNT_KEY);
        if (count) {
          setNotificationCount(Number.parseInt(count, 10));
        }
      } catch (error) {
        debugLog('Failed to load notification count', error);
      }
    };

    loadNotificationCount();
  }, []);

  // 알림 표시 조건 확인
  useEffect(() => {
    const checkNotificationConditions = async () => {
      if (!(isUpdateAvailable && updateInfo)) {
        setShouldShowNotification(false);
        return;
      }

      // 이미 무시된 업데이트인지 확인
      if (updateInfo.updateId && dismissedUpdates.has(updateInfo.updateId)) {
        setShouldShowNotification(false);
        return;
      }

      // 사용자 설정 확인
      const userSettings = await getUserSettings();
      if (!userSettings.enableNotifications) {
        setShouldShowNotification(false);
        return;
      }

      // 에러 상태에서는 알림 표시 안 함
      if (error) {
        setShouldShowNotification(false);
        return;
      }

      setShouldShowNotification(true);
    };

    checkNotificationConditions();
  }, [isUpdateAvailable, updateInfo, dismissedUpdates, error]);

  // 알림 타입 결정 로직
  const determineNotificationType = useCallback(
    (metadata?: UpdateMetadata): NotificationType => {
      if (!metadata) {
        return notificationCount === 0 ? 'modal' : 'snackbar';
      }

      const { priority, forceUpdate } = metadata;

      // 강제 업데이트는 항상 모달
      if (forceUpdate) {
        return 'modal';
      }

      // 우선순위에 따른 알림 타입 결정
      switch (priority) {
        case 'critical':
          return 'modal';
        case 'high':
          return notificationCount === 0 ? 'modal' : 'snackbar';
        case 'medium':
          return 'snackbar';
        case 'low':
          return notificationCount < 3 ? 'snackbar' : 'none';
        default:
          return 'snackbar';
      }
    },
    [notificationCount]
  );

  // 알림 표시 함수
  const showNotification = useCallback(
    (type: NotificationType, metadata?: UpdateMetadata) => {
      if (!shouldShowNotification) {
        return;
      }

      const { title, description, isForced } = getUpdateMessage(metadata);
      const priority = metadata?.priority || 'medium';

      setNotification({
        show: true,
        type,
        title,
        description,
        isForced,
        priority,
        dismissible: !isForced,
        autoDismiss: type === 'snackbar' && !isForced,
      });

      // 알림 횟수 증가
      const newCount = notificationCount + 1;
      setNotificationCount(newCount);
      AsyncStorage.setItem(NOTIFICATION_COUNT_KEY, newCount.toString());

      logUpdateEvent('notification_shown', {
        type,
        priority,
        isForced,
        count: newCount,
      });
    },
    [shouldShowNotification, notificationCount]
  );

  // 알림 숨기기 함수
  const hideNotification = useCallback(() => {
    setNotification((prev) => ({ ...prev, show: false }));

    // 일정 시간 후 상태 초기화
    setTimeout(() => {
      setNotification({
        show: false,
        type: 'none',
        title: '',
        description: '',
        isForced: false,
        priority: 'medium',
        dismissible: true,
        autoDismiss: false,
      });
    }, 300); // 애니메이션 시간 고려
  }, []);

  // 지금 업데이트 액션
  const onUpdateNow = useCallback(async () => {
    logUpdateEvent('update_now_clicked', {
      notificationType: notification.type,
      priority: notification.priority,
    });

    hideNotification();

    if (isPending) {
      // 이미 다운로드된 업데이트 적용
      await applyUpdate();
    } else if (isUpdateAvailable) {
      // 업데이트 다운로드 후 적용
      await downloadUpdate();
      // downloadUpdate 완료 후 자동으로 applyUpdate가 호출됨
    }
  }, [
    notification,
    isPending,
    isUpdateAvailable,
    downloadUpdate,
    applyUpdate,
    hideNotification,
  ]);

  // 나중에 업데이트 액션
  const onUpdateLater = useCallback(() => {
    logUpdateEvent('update_later_clicked', {
      notificationType: notification.type,
      priority: notification.priority,
    });

    hideNotification();

    // 백그라운드에서 다운로드 시작 (사용자가 원할 때 바로 적용 가능)
    if (isUpdateAvailable && !isPending) {
      getUserSettings().then((settings) => {
        if (settings.autoDownload) {
          downloadUpdate();
        }
      });
    }
  }, [
    notification,
    isUpdateAvailable,
    isPending,
    downloadUpdate,
    hideNotification,
  ]);

  // 알림 무시 액션
  const onDismiss = useCallback(() => {
    if (!notification.dismissible) {
      return;
    }

    logUpdateEvent('update_dismissed', {
      notificationType: notification.type,
      priority: notification.priority,
    });

    hideNotification();

    // 현재 업데이트를 무시 목록에 추가
    if (updateInfo?.updateId) {
      const newDismissed = new Set(dismissedUpdates);
      newDismissed.add(updateInfo.updateId);
      setDismissedUpdates(newDismissed);

      AsyncStorage.setItem(
        DISMISSED_UPDATES_KEY,
        JSON.stringify(Array.from(newDismissed))
      );
    }

    dismissUpdate();
  }, [
    notification,
    updateInfo,
    dismissedUpdates,
    dismissUpdate,
    hideNotification,
  ]);

  // 앱 상태 변경 시 알림 처리
  useEffect(() => {
    const handleAppStateChange = (nextAppState: AppStateStatus) => {
      if (nextAppState === 'active' && shouldShowNotification) {
        // 앱이 포그라운드로 올 때 알림 표시 여부 재확인
        const metadata: UpdateMetadata = {
          priority: 'medium', // 기본값
        };

        const type = determineNotificationType(metadata);
        if (type !== 'none') {
          showNotification(type, metadata);
        }
      }
    };

    const subscription = AppState.addEventListener(
      'change',
      handleAppStateChange
    );
    return () => subscription?.remove();
  }, [shouldShowNotification, determineNotificationType, showNotification]);

  // 업데이트 상태 변경 시 자동 알림 처리
  useEffect(() => {
    if (
      status === 'available' &&
      shouldShowNotification &&
      !notification.show
    ) {
      const metadata: UpdateMetadata = {
        priority: 'medium', // 기본값, 실제로는 서버에서 받아올 수 있음
      };

      const type = determineNotificationType(metadata);
      if (type !== 'none') {
        showNotification(type, metadata);
      }
    }
  }, [
    status,
    shouldShowNotification,
    notification.show,
    determineNotificationType,
    showNotification,
  ]);

  // 자동 닫기 처리
  useEffect(() => {
    if (notification.show && notification.autoDismiss) {
      const timer = setTimeout(() => {
        hideNotification();
      }, UPDATE_CONFIG.SNACKBAR_DURATION);

      return () => clearTimeout(timer);
    }
  }, [notification.show, notification.autoDismiss, hideNotification]);

  return {
    // 알림 상태
    notification,

    // 알림 액션
    showNotification,
    hideNotification,

    // 사용자 액션
    onUpdateNow,
    onUpdateLater,
    onDismiss,

    // 설정
    shouldShowNotification,
    notificationCount,
  };
};
