import * as Notifications from 'expo-notifications';
import { SchedulableTriggerInputTypes } from 'expo-notifications';
import { Platform } from 'react-native';
import type { Bean } from '@/types/bean';
import { getDegassingCompletionAt } from '@/utils/degassingUtils';
import { ensureNotificationPermission } from './permissions';

const IDENTIFIER_PREFIX = 'degassing-';

function getDegassingIdentifier(beanId: string): string {
  return `${IDENTIFIER_PREFIX}${beanId}`;
}

/**
 * Completion time for a bean that still deserves a notification, or null when it
 * is unschedulable. Invalid roast dates and out-of-range degassing periods are
 * rejected by the shared local-calendar calculation; an already-elapsed
 * completion time is rejected here.
 */
function getPendingCompletionAt(bean: Bean): Date | null {
  const completionAt = getDegassingCompletionAt(
    bean.roast_date,
    bean.degassing_days,
  );
  if (!completionAt) return null;

  if (completionAt <= new Date()) return null;

  return completionAt;
}

export async function scheduleDegassing(
  bean: Bean,
): Promise<string | null> {
  if (Platform.OS === 'web') return null;

  const completionAt = getPendingCompletionAt(bean);
  if (!completionAt) return null;

  const hasPermission = await ensureNotificationPermission();
  if (!hasPermission) return null;

  try {
    return await Notifications.scheduleNotificationAsync({
      identifier: getDegassingIdentifier(bean.id),
      content: {
        title: '디게싱 완료',
        body: `${bean.name.trim()} 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!`,
        data: {
          url: `/beans/${bean.id}`,
          beanId: bean.id,
          type: 'degassing-complete',
        },
        sound: 'default',
      },
      trigger: {
        type: SchedulableTriggerInputTypes.DATE,
        date: completionAt,
      },
    });
  } catch (error) {
    // 알림은 best-effort 부수효과다: 원두 저장을 막지 않도록 삼키되 원인은 남긴다.
    console.warn('[degassing] 알림 예약 실패', error);
    return null;
  }
}

export async function cancelDegassing(beanId: string): Promise<void> {
  if (Platform.OS === 'web') return;

  try {
    await Notifications.cancelScheduledNotificationAsync(
      getDegassingIdentifier(beanId),
    );
  } catch (error) {
    // 존재하지 않는 identifier로 cancel해도 안전하지만 원인은 남긴다.
    console.warn('[degassing] 알림 취소 실패', error);
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

  const activeBeans = beans.filter(
    (bean) => getPendingCompletionAt(bean) !== null,
  );
  const activeBeanIds = new Set(activeBeans.map((b) => b.id));

  const missingBeans = activeBeans.filter((b) => !scheduledBeanIds.has(b.id));
  await Promise.all(missingBeans.map((bean) => scheduleDegassing(bean)));

  const orphanedIds = [...scheduledBeanIds].filter(
    (id) => !activeBeanIds.has(id),
  );
  await Promise.all(orphanedIds.map((id) => cancelDegassing(id)));
}
