import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import type { Bean } from '@/types/bean';
import {
  cancelDegassing,
  rescheduleDegassing,
  scheduleDegassing,
} from '../degassing';

type ScheduleRequest = Parameters<
  typeof Notifications.scheduleNotificationAsync
>[0];

const scheduleMock = jest.mocked(Notifications.scheduleNotificationAsync);
const cancelMock = jest.mocked(Notifications.cancelScheduledNotificationAsync);
const getPermissionsMock = jest.mocked(Notifications.getPermissionsAsync);
const requestPermissionsMock = jest.mocked(
  Notifications.requestPermissionsAsync
);

const SCHEDULED_ID = 'mock-notification-id';

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

function setPermission(status: 'granted' | 'denied'): void {
  getPermissionsMock.mockResolvedValue(permissionStatus(status));
  requestPermissionsMock.mockResolvedValue(permissionStatus(status));
}

function createBean(overrides: Partial<Bean> = {}): Bean {
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

function readScheduledRequest(): ScheduleRequest {
  const call = scheduleMock.mock.calls[0];
  if (!call) {
    throw new Error('scheduleNotificationAsync was never called');
  }
  return call[0];
}

function readTriggerDate(request: ScheduleRequest): Date {
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

// Local wall-clock pin: built from local components so the suite means the same
// calendar instant under any TZ. Completion for the default fixture
// (2026-01-01 + 14 days at 09:00 local) is 2026-01-15T09:00 local — comfortably
// in the future relative to this pin, and clear of any DST transition.
const PINNED_LOCAL_NOW = new Date(2026, 0, 10, 12, 0, 0, 0);

describe('lib/notifications/degassing', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers({ now: PINNED_LOCAL_NOW });
    scheduleMock.mockResolvedValue(SCHEDULED_ID);
    cancelMock.mockResolvedValue(undefined);
    setPermission('granted');
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('scheduleDegassing', () => {
    describe('Given a bean whose completion time is still in the future', () => {
      it('When scheduling, Then exactly one notification is scheduled with the agreed payload', async () => {
        const bean = createBean({
          id: 'bean-42',
          name: '콜롬비아 수프리모',
          roast_date: '2026-01-01',
          degassing_days: 14,
        });

        const result = await scheduleDegassing(bean);

        expect(result).toBe(SCHEDULED_ID);
        expect(scheduleMock).toHaveBeenCalledTimes(1);
        expect(readScheduledRequest()).toEqual({
          identifier: 'degassing-bean-42',
          content: {
            title: '디게싱 완료',
            body: '콜롬비아 수프리모 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!',
            data: {
              url: '/beans/bean-42',
              beanId: 'bean-42',
              type: 'degassing-complete',
            },
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: new Date(2026, 0, 15, 9, 0, 0, 0),
          },
        });
      });

      it('When scheduling, Then the trigger fires at 09:00 on the local completion day', async () => {
        const bean = createBean({
          roast_date: '2026-01-01',
          degassing_days: 14,
        });

        await scheduleDegassing(bean);
        const triggerDate = readTriggerDate(readScheduledRequest());

        expect(triggerDate.getFullYear()).toBe(2026);
        expect(triggerDate.getMonth()).toBe(0);
        expect(triggerDate.getDate()).toBe(15);
        expect(triggerDate.getHours()).toBe(9);
        expect(triggerDate.getMinutes()).toBe(0);
        expect(triggerDate.getSeconds()).toBe(0);
        expect(triggerDate.getMilliseconds()).toBe(0);
      });

      it('When scheduling, Then permission is resolved before the notification is scheduled', async () => {
        await scheduleDegassing(createBean());

        expect(getPermissionsMock).toHaveBeenCalledTimes(1);
        expect(getPermissionsMock.mock.invocationCallOrder[0]).toBeLessThan(
          scheduleMock.mock.invocationCallOrder[0]
        );
      });

      it('When permission is already granted, Then it is not requested again', async () => {
        await scheduleDegassing(createBean());

        expect(requestPermissionsMock).not.toHaveBeenCalled();
        expect(scheduleMock).toHaveBeenCalledTimes(1);
      });
    });

    describe('Given inputs that must never be scheduled', () => {
      const excluded: { label: string; overrides: Partial<Bean> }[] = [
        { label: 'roast_date is null', overrides: { roast_date: null } },
        {
          label: 'degassing_days is null',
          overrides: { degassing_days: null },
        },
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
        {
          label: 'degassing_days exceeds 365',
          overrides: { degassing_days: 366 },
        },
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

      it.each(excluded)(
        'When $label, Then return null without asking permission or scheduling',
        async ({ overrides }) => {
          const result = await scheduleDegassing(createBean(overrides));

          expect(result).toBeNull();
          expect(scheduleMock).not.toHaveBeenCalled();
          expect(getPermissionsMock).not.toHaveBeenCalled();
          expect(requestPermissionsMock).not.toHaveBeenCalled();
        }
      );
    });

    describe('Given the completion time is exactly now', () => {
      // 2026-01-01 + 14 days at 09:00 local == this pin, so the guard must treat
      // "<= now" as past and refuse to schedule.
      const COMPLETION_INSTANT = new Date(2026, 0, 15, 9, 0, 0, 0);

      beforeEach(() => {
        jest.useFakeTimers({ now: COMPLETION_INSTANT });
      });

      it('When scheduling, Then return null without scheduling', async () => {
        const result = await scheduleDegassing(
          createBean({ roast_date: '2026-01-01', degassing_days: 14 })
        );

        expect(result).toBeNull();
        expect(scheduleMock).not.toHaveBeenCalled();
      });
    });

    describe('Given the user denied notification permission', () => {
      beforeEach(() => {
        setPermission('denied');
      });

      it('When scheduling, Then return null and schedule nothing', async () => {
        const result = await scheduleDegassing(createBean());

        expect(result).toBeNull();
        expect(requestPermissionsMock).toHaveBeenCalledTimes(1);
        expect(scheduleMock).not.toHaveBeenCalled();
      });
    });

    describe('Given the app runs on web', () => {
      let platformReplacement: ReturnType<typeof jest.replaceProperty> | null =
        null;

      beforeEach(() => {
        platformReplacement = jest.replaceProperty(Platform, 'OS', 'web');
      });

      afterEach(() => {
        platformReplacement?.restore();
        platformReplacement = null;
      });

      it('When scheduling, Then return null without touching the notification APIs', async () => {
        const result = await scheduleDegassing(createBean());

        expect(Platform.OS).toBe('web');
        expect(result).toBeNull();
        expect(scheduleMock).not.toHaveBeenCalled();
        expect(getPermissionsMock).not.toHaveBeenCalled();
      });
    });
  });

  describe('cancelDegassing', () => {
    it('When cancelling, Then the exact degassing identifier is cancelled', async () => {
      await cancelDegassing('bean-42');

      expect(cancelMock).toHaveBeenCalledTimes(1);
      expect(cancelMock).toHaveBeenCalledWith('degassing-bean-42');
    });
  });

  describe('rescheduleDegassing', () => {
    it('When rescheduling, Then the old notification is cancelled before the new one is scheduled', async () => {
      const bean = createBean({ id: 'bean-42' });

      const result = await rescheduleDegassing(bean);

      expect(result).toBe(SCHEDULED_ID);
      expect(cancelMock).toHaveBeenCalledWith('degassing-bean-42');
      expect(scheduleMock).toHaveBeenCalledTimes(1);
      expect(cancelMock.mock.invocationCallOrder[0]).toBeLessThan(
        scheduleMock.mock.invocationCallOrder[0]
      );
    });

    it('When the bean is no longer schedulable, Then the old notification is still cancelled', async () => {
      const bean = createBean({ id: 'bean-42', degassing_days: 0 });

      const result = await rescheduleDegassing(bean);

      expect(result).toBeNull();
      expect(cancelMock).toHaveBeenCalledWith('degassing-bean-42');
      expect(scheduleMock).not.toHaveBeenCalled();
    });
  });
});
