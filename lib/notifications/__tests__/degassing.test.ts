import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  cancelDegassing,
  rescheduleDegassing,
  scheduleDegassing,
} from '../degassing';
import {
  cancelMock,
  createBean,
  EXPECTED_COMPLETION_AT,
  getPermissionsMock,
  PINNED_LOCAL_NOW,
  readScheduledRequest,
  readTriggerDate,
  requestPermissionsMock,
  scheduleMock,
  SCHEDULED_ID,
  setPermission,
  UNSCHEDULABLE_CASES,
} from './degassingFixtures';

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
            data: { url: '/beans/bean-42' },
            sound: 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: EXPECTED_COMPLETION_AT,
          },
        });
      });

      it('When scheduling, Then the deep link is the only payload data', async () => {
        await scheduleDegassing(createBean({ id: 'bean-42' }));

        expect(readScheduledRequest().content.data).toEqual({
          url: '/beans/bean-42',
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

      it('When the bean name has surrounding whitespace, Then the body uses the trimmed name', async () => {
        await scheduleDegassing(
          createBean({ name: '  콜롬비아 수프리모  ' })
        );

        expect(readScheduledRequest().content.body).toBe(
          '콜롬비아 수프리모 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!'
        );
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
      it.each(UNSCHEDULABLE_CASES)(
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
      beforeEach(() => {
        // 2026-01-01 + 14 days at 09:00 local == this pin, so the guard must
        // treat "<= now" as past and refuse to schedule.
        jest.useFakeTimers({ now: EXPECTED_COMPLETION_AT });
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
