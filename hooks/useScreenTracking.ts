import { usePathname, useSegments } from 'expo-router';
import { usePostHog } from 'posthog-react-native';
import { useEffect } from 'react';

// Same names PostHog's react-navigation captureScreens reported (`recipes/[id]`),
// so existing $screen insights keep matching.
export const getScreenName = (segments: string[]) => {
  const visible = segments[0]?.startsWith('(') ? segments.slice(1) : segments;
  return visible.join('/') || 'index';
};

export const useScreenTracking = () => {
  const posthog = usePostHog();
  const pathname = usePathname();
  const screenName = getScreenName(useSegments());

  useEffect(() => {
    posthog.screen(screenName, { pathname });
  }, [posthog, screenName, pathname]);
};
