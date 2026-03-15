import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import dayjs from 'dayjs';
import type { Bean } from '@/types/bean';
import { ensureNotificationPermission } from './permissions';

const IDENTIFIER_PREFIX = 'degassing-';

function getDegassingIdentifier(beanId: string): string {
  return `${IDENTIFIER_PREFIX}${beanId}`;
}

function getCompletionDate(bean: Bean): Date | null {
  if (bean.roast_date === null || bean.degassing_days === null) return null;

  const completionDate = dayjs(bean.roast_date)
    .add(bean.degassing_days, 'day')
    .hour(9)
    .minute(0)
    .second(0)
    .toDate();

  if (completionDate <= new Date()) return null;

  return completionDate;
}

export async function scheduleDegassing(
  bean: Bean,
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const completionDate = getCompletionDate(bean);
  if (!completionDate) return null;

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      identifier: getDegassingIdentifier(bean.id),
      content: {
        title: '☕ 디개싱 완료!',
        body: `'${bean.name}'의 디개싱이 완료되었어요. 최적의 맛을 즐겨보세요!`,
        data: { url: `/beans/${bean.id}` },
        sound: 'default',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: completionDate,
      },
    });
  } catch {
    return null;
  }
}

export async function cancelDegassing(beanId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelScheduledNotificationAsync(
      getDegassingIdentifier(beanId),
    );
  } catch {
    // 존재하지 않는 identifier로 cancel해도 안전
  }
}

export async function rescheduleDegassing(
  bean: Bean,
): Promise<string | null> {
  await cancelDegassing(bean.id);
  return scheduleDegassing(bean);
}

export async function reconcileDegassing(beans: Bean[]): Promise<void> {
  if (Platform.OS === 'web') return;

  const scheduled = await Notifications.getAllScheduledNotificationsAsync();

  const scheduledBeanIds = new Set(
    scheduled
      .map((n) => n.identifier)
      .filter((id) => id.startsWith(IDENTIFIER_PREFIX))
      .map((id) => id.slice(IDENTIFIER_PREFIX.length)),
  );

  const activeBeans = beans.filter((bean) => getCompletionDate(bean) !== null);
  const activeBeanIds = new Set(activeBeans.map((b) => b.id));

  const missingBeans = activeBeans.filter((b) => !scheduledBeanIds.has(b.id));
  await Promise.all(missingBeans.map((bean) => scheduleDegassing(bean)));

  const orphanedIds = [...scheduledBeanIds].filter(
    (id) => !activeBeanIds.has(id),
  );
  await Promise.all(orphanedIds.map((id) => cancelDegassing(id)));
}
