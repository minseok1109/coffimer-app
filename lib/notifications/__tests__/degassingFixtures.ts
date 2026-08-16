import * as Notifications from 'expo-notifications';
import type { Bean } from '@/types/bean';

export type ScheduleRequest = Parameters<
  typeof Notifications.scheduleNotificationAsync
>[0];

export const SCHEDULED_ID = 'mock-notification-id';

/**
 * Local wall-clock pin: built from local components so the suite means the same
 * calendar instant under any TZ. Completion for the default fixture
 * (2026-01-01 + 14 days at 09:00 local) is 2026-01-15T09:00 local — comfortably
 * in the future relative to this pin, and clear of any DST transition.
 */
export const PINNED_LOCAL_NOW = new Date(2026, 0, 10, 12, 0, 0, 0);

/** The default fixture's completion instant, to the millisecond. */
export const EXPECTED_COMPLETION_AT = new Date(2026, 0, 15, 9, 0, 0, 0);

export const scheduleMock = jest.mocked(
  Notifications.scheduleNotificationAsync
);
export const cancelMock = jest.mocked(
  Notifications.cancelScheduledNotificationAsync
);
export const getPermissionsMock = jest.mocked(Notifications.getPermissionsAsync);
export const requestPermissionsMock = jest.mocked(
  Notifications.requestPermissionsAsync
);
export const getAllScheduledMock = jest.mocked(
  Notifications.getAllScheduledNotificationsAsync
);

/**
 * The OS permission adapter is the only thing mocked in this suite: the real
 * `ensureNotificationPermission` runs against these responses. The cast is the
 * narrowest way to hand back the two fields that code path reads.
 */
function permissionStatus(
  status: 'granted' | 'denied'
): Notifications.NotificationPermissionsStatus {
  return {
    status,
    granted: status === 'granted',
    canAskAgain: true,
    expires: 'never',
  } as unknown as Notifications.NotificationPermissionsStatus;
}

export function setPermission(status: 'granted' | 'denied'): void {
  getPermissionsMock.mockResolvedValue(permissionStatus(status));
  requestPermissionsMock.mockResolvedValue(permissionStatus(status));
}

export function createBean(overrides: Partial<Bean> = {}): Bean {
  return {
    id: 'bean-1',
    name: '에티오피아 예가체프',
    roastery_name: null,
    roast_date: '2026-01-01',
    opened_date: null,
    roast_level: null,
    bean_type: 'single_origin',
    weight_g: 200,
    remaining_g: 200,
    price: null,
    cup_notes: [],
    images: [],
    user_id: 'user-1',
    created_at: '2026-01-01T00:00:00.000Z',
    degassing_days: 14,
    variety: null,
    process_method: null,
    notes: null,
    updated_at: '2026-01-01T00:00:00.000Z',
    ...overrides,
  };
}

export function readScheduledRequest(): ScheduleRequest {
  const call = scheduleMock.mock.calls[0];
  if (!call) {
    throw new Error('scheduleNotificationAsync was never called');
  }
  return call[0];
}

/**
 * A fully-typed stand-in for an entry the OS reports as already scheduled.
 * Only `identifier` carries meaning for reconcile; the rest is the smallest
 * content/trigger pair that satisfies the public NotificationRequest shape, so
 * no cast is needed to fake the OS response.
 */
export function scheduledRequest(
  identifier: string
): Notifications.NotificationRequest {
  return {
    identifier,
    content: {
      title: null,
      subtitle: null,
      body: null,
      categoryIdentifier: null,
      sound: null,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: EXPECTED_COMPLETION_AT,
    },
  };
}

/** Every identifier handed to `cancelScheduledNotificationAsync`, in order. */
export function cancelledIdentifiers(): string[] {
  return cancelMock.mock.calls.map(([identifier]) => identifier);
}

/** Every identifier handed to `scheduleNotificationAsync`, in order. */
export function scheduledIdentifiers(): string[] {
  return scheduleMock.mock.calls.map(([request]) => request.identifier ?? '');
}

export function readTriggerDate(request: ScheduleRequest): Date {
  const { trigger } = request;
  if (
    trigger &&
    typeof trigger === 'object' &&
    'date' in trigger &&
    trigger.date instanceof Date
  ) {
    return trigger.date;
  }
  throw new Error('trigger.date is not a Date');
}

/**
 * Every input shape that must never reach the OS scheduler. Each entry is
 * asserted to return null, schedule nothing, and never ask for permission.
 */
export const UNSCHEDULABLE_CASES: {
  label: string;
  overrides: Partial<Bean>;
}[] = [
  { label: 'roast_date is null', overrides: { roast_date: null } },
  { label: 'degassing_days is null', overrides: { degassing_days: null } },
  { label: 'degassing_days is 0', overrides: { degassing_days: 0 } },
  {
    // Completion would land in the future if 0 days were merely added to the
    // roast date, so this case fails unless 0 is rejected on its own merit.
    label: 'degassing_days is 0 and the roast date is in the future',
    overrides: { roast_date: '2026-01-20', degassing_days: 0 },
  },
  { label: 'degassing_days is negative', overrides: { degassing_days: -1 } },
  {
    label: 'degassing_days is not an integer',
    overrides: { degassing_days: 14.5 },
  },
  { label: 'degassing_days exceeds 365', overrides: { degassing_days: 366 } },
  {
    label: 'roast_date is malformed',
    overrides: { roast_date: '2026/01/01' },
  },
  {
    label: 'roast_date is an impossible calendar date',
    overrides: { roast_date: '2026-02-30' },
  },
  {
    label: 'the completion time is in the past',
    overrides: { roast_date: '2025-12-01', degassing_days: 5 },
  },
];
