import * as Notifications from 'expo-notifications';
import type { Href } from 'expo-router';
import { router } from 'expo-router';
import { useEffect } from 'react';

/**
 * The only deep link degassing notifications emit: `/beans/{id}` with exactly
 * one non-empty segment and no query, hash or nested path.
 *
 * `lib/notifications/degassing.ts` is the sole producer of this payload, but
 * the value still arrives from the OS notification store, so it is treated as
 * untrusted input. Narrowing here is what lets `router.push` receive a real
 * `Href` instead of an `as` assertion: the pattern is a strict subset of the
 * generated `/beans/${SingleRoutePart<string>}` route, so anything that passes
 * is genuinely a valid typed route.
 */
const BEAN_DEEP_LINK_PATTERN = /^\/beans\/[^/?#]+$/;

function isBeanDeepLink(value: unknown): value is Href {
  return typeof value === 'string' && BEAN_DEEP_LINK_PATTERN.test(value);
}

export function useNotificationObserver(): void {
  useEffect(() => {
    function redirect(notification: Notifications.Notification) {
      const url = notification.request.content.data?.url;
      if (isBeanDeepLink(url)) {
        router.push(url);
      }
    }

    const response = Notifications.getLastNotificationResponse();
    if (response?.notification) {
      redirect(response.notification);
    }

    const subscription =
      Notifications.addNotificationResponseReceivedListener((response) => {
        redirect(response.notification);
      });

    return () => subscription.remove();
  }, []);
}
