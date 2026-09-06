import * as Notifications from 'expo-notifications';
import { cancelDebugNotification, scheduleDebugNotification } from '../debug';
import { ensureNotificationPermission, setupNotificationChannel } from '../permissions';

jest.mock('../permissions', () => ({
  ensureNotificationPermission: jest.fn(),
  setupNotificationChannel: jest.fn(),
}));

beforeEach(() => {
  jest.clearAllMocks();
  jest.mocked(ensureNotificationPermission).mockResolvedValue(true);
});

it('schedules a separate five-second notification linking to the selected bean', async () => {
  await scheduleDebugNotification({ id: 'bean-42', name: ' 에티오피아 ' });
  expect(setupNotificationChannel).toHaveBeenCalled();
  expect(Notifications.scheduleNotificationAsync).toHaveBeenCalledWith(expect.objectContaining({
    identifier: 'debug-degassing',
    content: { title: '디게싱 완료', body: '에티오피아 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!', sound: 'default', data: { url: '/beans/bean-42' } },
    trigger: expect.objectContaining({ seconds: 5, repeats: false }),
  }));
});

it('does not schedule when permission is denied', async () => {
  jest.mocked(ensureNotificationPermission).mockResolvedValue(false);
  await expect(scheduleDebugNotification({ id: 'bean-42', name: ' 에티오피아 ' })).resolves.toBe(false);
  expect(Notifications.scheduleNotificationAsync).not.toHaveBeenCalled();
});

it('cancels only the debug notification', async () => {
  await cancelDebugNotification();
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledWith('debug-degassing');
  expect(Notifications.cancelScheduledNotificationAsync).toHaveBeenCalledTimes(1);
});
