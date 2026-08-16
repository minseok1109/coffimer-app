import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import {
  ensureNotificationPermission,
  setupNotificationChannel,
} from '../permissions';

/**
 * The real `AndroidImportance.HIGH` from expo-notifications 55.0.12
 * (`build/NotificationChannelManager.types.d.ts`: UNKNOWN=0, UNSPECIFIED=1,
 * NONE=2, MIN=3, LOW=4, DEFAULT=5, HIGH=6, MAX=7).
 *
 * Pinned as a literal on purpose: the suite runs against the jest mock, so
 * asserting only `Notifications.AndroidImportance.HIGH` would be circular — a
 * mock that degraded HIGH to LOW (4) would still "match itself" while Android
 * silently lost heads-up delivery. Both the literal and the enum identity are
 * asserted so mock drift and production drift each fail.
 */
const REAL_ANDROID_IMPORTANCE_HIGH = 6;

const setChannelMock = jest.mocked(Notifications.setNotificationChannelAsync);
const getPermissionsMock = jest.mocked(Notifications.getPermissionsAsync);
const requestPermissionsMock = jest.mocked(
  Notifications.requestPermissionsAsync
);

type PermissionOutcome = 'granted' | 'denied';

/**
 * The narrowest stand-in for the OS permission response. Only `status` steers
 * `ensureNotificationPermission`; the remaining fields exist so the object
 * satisfies the public `NotificationPermissionsStatus` shape.
 */
function permissionStatus(
  status: PermissionOutcome
): Notifications.NotificationPermissionsStatus {
  return {
    status,
    granted: status === 'granted',
    canAskAgain: true,
    expires: 'never',
  } as unknown as Notifications.NotificationPermissionsStatus;
}

/** Drives the two OS calls independently so "denied then granted" is real. */
function setPermissions(
  existing: PermissionOutcome,
  requested: PermissionOutcome
): void {
  getPermissionsMock.mockResolvedValue(permissionStatus(existing));
  requestPermissionsMock.mockResolvedValue(permissionStatus(requested));
}

/**
 * `jest.spyOn(Platform, 'OS', 'get')` throws "Property `OS` does not have
 * access type get" in this environment (react-native exposes OS as a plain data
 * property), so `jest.replaceProperty` is the transition that actually works.
 *
 * `restoreMocks` is NOT enabled in `jest.config.js`, so the replacement does
 * not roll back on its own — verified by a leak that carried `android` into the
 * following test. Every describe that switches platform therefore restores
 * explicitly, which keeps the `ios` default true regardless of test order.
 * Both production functions read `Platform.OS` at call time, so no module
 * re-import is required.
 */
function runOnPlatform(os: typeof Platform.OS): void {
  jest.replaceProperty(Platform, 'OS', os);
}

describe('lib/notifications/permissions setupNotificationChannel', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // The real API resolves the created channel, or null when the platform has
    // no channels; null is the honest stand-in and production ignores it.
    setChannelMock.mockResolvedValue(null);
  });

  describe('Given the app runs on iOS', () => {
    it('When setting up channels, Then the Android-only channel API is never touched', async () => {
      expect(Platform.OS).toBe('ios');

      await setupNotificationChannel();

      expect(setChannelMock).not.toHaveBeenCalled();
    });
  });

  describe('Given the app runs on Android', () => {
    beforeEach(() => {
      runOnPlatform('android');
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('When setting up channels, Then exactly one degassing channel is created', async () => {
      expect(Platform.OS).toBe('android');

      await setupNotificationChannel();

      expect(setChannelMock).toHaveBeenCalledTimes(1);
      expect(setChannelMock).toHaveBeenCalledWith(
        'degassing',
        expect.objectContaining({ name: '디개싱 알림', sound: 'default' })
      );
    });

    it('When setting up channels, Then importance is HIGH so the notification pops as a heads-up', async () => {
      await setupNotificationChannel();

      const [, channel] = setChannelMock.mock.calls[0];

      expect(channel.importance).toBe(REAL_ANDROID_IMPORTANCE_HIGH);
      expect(channel.importance).toBe(Notifications.AndroidImportance.HIGH);
    });

    it('When the mocked enum is compared to the shipped enum, Then HIGH is still 6', () => {
      expect(Notifications.AndroidImportance.HIGH).toBe(
        REAL_ANDROID_IMPORTANCE_HIGH
      );
    });
  });

  describe('Given the platform transition itself', () => {
    it('When a test replaced Platform.OS, Then the next test starts back on the ios default', () => {
      expect(Platform.OS).toBe('ios');
    });
  });
});

describe('lib/notifications/permissions ensureNotificationPermission', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    setPermissions('granted', 'granted');
  });

  describe('Given permission was already granted', () => {
    it('When ensuring permission, Then it resolves true without prompting again', async () => {
      setPermissions('granted', 'denied');

      await expect(ensureNotificationPermission()).resolves.toBe(true);

      expect(getPermissionsMock).toHaveBeenCalledTimes(1);
      expect(requestPermissionsMock).not.toHaveBeenCalled();
    });
  });

  describe('Given permission has not been granted yet', () => {
    it('When the user accepts the prompt, Then it prompts once and resolves true', async () => {
      setPermissions('denied', 'granted');

      await expect(ensureNotificationPermission()).resolves.toBe(true);

      expect(requestPermissionsMock).toHaveBeenCalledTimes(1);
    });

    it('When the user rejects the prompt, Then it prompts once and resolves false', async () => {
      setPermissions('denied', 'denied');

      await expect(ensureNotificationPermission()).resolves.toBe(false);

      expect(requestPermissionsMock).toHaveBeenCalledTimes(1);
    });
  });

  describe('Given the app runs on web, where local notifications are unsupported', () => {
    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('When ensuring permission, Then it resolves false without asking the OS', async () => {
      runOnPlatform('web');

      await expect(ensureNotificationPermission()).resolves.toBe(false);

      expect(getPermissionsMock).not.toHaveBeenCalled();
      expect(requestPermissionsMock).not.toHaveBeenCalled();
    });
  });
});
