import * as Notifications from 'expo-notifications';
import type { Bean } from '@/types/bean';
import { getDegassingNotificationContent } from './content';
import { ensureNotificationPermission, setupNotificationChannel } from './permissions';

const DEBUG_IDENTIFIER = 'debug-degassing';

export async function scheduleDebugNotification(bean: Pick<Bean, 'id' | 'name'>): Promise<boolean> {
  if (!__DEV__) return false;
  await setupNotificationChannel();
  if (!(await ensureNotificationPermission())) return false;

  await Notifications.cancelScheduledNotificationAsync(DEBUG_IDENTIFIER);
  await Notifications.scheduleNotificationAsync({
    identifier: DEBUG_IDENTIFIER,
    content: getDegassingNotificationContent(bean),
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 5,
      repeats: false,
      channelId: 'degassing',
    },
  });
  return true;
}

export async function cancelDebugNotification(): Promise<void> {
  if (!__DEV__) return;
  await Notifications.cancelScheduledNotificationAsync(DEBUG_IDENTIFIER);
}
