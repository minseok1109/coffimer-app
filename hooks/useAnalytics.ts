import { usePostHog } from 'posthog-react-native';

export interface AnalyticsEvents {
  // Recipe Events
  recipe_viewed: { recipe_id: string; recipe_name: string };
  recipe_started: {
    recipe_id: string;
    recipe_name: string;
    total_time: number;
  };
  recipe_completed: {
    recipe_id: string;
    recipe_name: string;
    total_time: number;
    completion_rate: number;
  };
  recipe_abandoned: {
    recipe_id: string;
    recipe_name: string;
    elapsed_time: number;
    completion_percentage: number;
  };

  // Timer Events
  timer_started: { recipe_id: string; step_index: number };
  timer_paused: { recipe_id: string; elapsed_time: number; step_index: number };
  timer_resumed: {
    recipe_id: string;
    elapsed_time: number;
    step_index: number;
  };
  timer_reset: { recipe_id: string; elapsed_time: number; step_index: number };
  step_completed: {
    recipe_id: string;
    step_index: number;
    step_duration: number;
  };

  // User Events
  app_opened: { session_id: string };
  screen_view: { screen_name: string };
  user_login: { method: string };
  user_logout: {};

  // Engagement Events
  notification_received: { type: string; recipe_id?: string };
  notification_tapped: { type: string; recipe_id?: string };
  external_link_clicked: { link_type: string; url: string };
  settings_changed: {
    setting_name: string;
    new_value: string | number | boolean;
  };
}

export const useAnalytics = () => {
  const posthog = usePostHog();

  const track = <K extends keyof AnalyticsEvents>(
    event: K,
    properties: AnalyticsEvents[K]
  ) => {
    try {
      if (posthog) {
        posthog.capture(event, properties);
        console.log('[Analytics] Event tracked:', event, properties);
      } else {
        console.warn('[Analytics] PostHog not available');
      }
    } catch (error) {
      console.warn('[Analytics] Tracking error:', error);
    }
  };

  const identify = (
    userId: string,
    properties?: Record<string, string | number | boolean | null>
  ) => {
    try {
      if (posthog) {
        posthog.identify(userId, properties);
        console.log('[Analytics] User identified:', userId, properties);
      } else {
        console.warn('[Analytics] PostHog not available for identify');
      }
    } catch (error) {
      console.warn('[Analytics] Identify error:', error);
    }
  };

  const screen = (
    screenName: string,
    properties?: Record<string, string | number | boolean | null>
  ) => {
    try {
      if (posthog) {
        posthog.screen(screenName, properties);
        track('screen_view', { screen_name: screenName });
        console.log('[Analytics] Screen tracked:', screenName, properties);
      } else {
        console.warn('[Analytics] PostHog not available for screen');
      }
    } catch (error) {
      console.warn('[Analytics] Screen error:', error);
    }
  };

  // Convenience methods for common events
  const trackRecipeStart = (
    recipeId: string,
    recipeName: string,
    totalTime: number
  ) => {
    track('recipe_started', {
      recipe_id: recipeId,
      recipe_name: recipeName,
      total_time: totalTime,
    });
  };

  const trackRecipeComplete = (
    recipeId: string,
    recipeName: string,
    totalTime: number,
    completionRate: number
  ) => {
    track('recipe_completed', {
      recipe_id: recipeId,
      recipe_name: recipeName,
      total_time: totalTime,
      completion_rate: completionRate,
    });
  };

  const trackTimerPause = (
    recipeId: string,
    elapsedTime: number,
    stepIndex: number
  ) => {
    track('timer_paused', {
      recipe_id: recipeId,
      elapsed_time: elapsedTime,
      step_index: stepIndex,
    });
  };

  const trackTimerResume = (
    recipeId: string,
    elapsedTime: number,
    stepIndex: number
  ) => {
    track('timer_resumed', {
      recipe_id: recipeId,
      elapsed_time: elapsedTime,
      step_index: stepIndex,
    });
  };

  const trackStepComplete = (
    recipeId: string,
    stepIndex: number,
    stepDuration: number
  ) => {
    track('step_completed', {
      recipe_id: recipeId,
      step_index: stepIndex,
      step_duration: stepDuration,
    });
  };

  // Debug method to test PostHog connection
  const testConnection = () => {
    if (posthog) {
      console.log('[Analytics] PostHog is connected and ready');
      track('app_opened', { session_id: Date.now().toString() });
      return true;
    }
    console.warn('[Analytics] PostHog is not available');
    return false;
  };

  return {
    track,
    identify,
    screen,
    testConnection,
    // Convenience methods
    trackRecipeStart,
    trackRecipeComplete,
    trackTimerPause,
    trackTimerResume,
    trackStepComplete,
  };
};
