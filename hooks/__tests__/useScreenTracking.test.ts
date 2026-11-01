import { renderHook } from '@testing-library/react-native';
import { getScreenName, useScreenTracking } from '@/hooks/useScreenTracking';

const mockScreen = jest.fn();
// usePostHog returns the same client from context on every render.
const mockPostHog = { screen: mockScreen };
let mockPathname = '/';
let mockSegments: string[] = ['(tabs)'];

jest.mock('posthog-react-native', () => ({
  usePostHog: () => mockPostHog,
}));

jest.mock('expo-router', () => ({
  usePathname: () => mockPathname,
  useSegments: () => mockSegments,
}));

describe('getScreenName', () => {
  it.each([
    [['(tabs)'], 'index'],
    [['(tabs)', 'recipes'], 'recipes'],
    [['(tabs)', 'beans'], 'beans'],
    [['recipes', '[id]'], 'recipes/[id]'],
    [['recipes', 'timer', '[id]'], 'recipes/timer/[id]'],
    [['beans', 'edit', '[id]'], 'beans/edit/[id]'],
    [['auth', 'login'], 'auth/login'],
    [[], 'index'],
  ])('maps segments %j to the route name %s', (segments, expected) => {
    expect(getScreenName(segments)).toBe(expected);
  });
});

describe('useScreenTracking', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockPathname = '/';
    mockSegments = ['(tabs)'];
  });

  it('captures the current screen once on mount', () => {
    renderHook(() => useScreenTracking());

    expect(mockScreen).toHaveBeenCalledTimes(1);
    expect(mockScreen).toHaveBeenCalledWith('index', { pathname: '/' });
  });

  it('captures again only when the route changes', () => {
    const { rerender } = renderHook(() => useScreenTracking());
    rerender({});
    expect(mockScreen).toHaveBeenCalledTimes(1);

    mockPathname = '/recipes/abc';
    mockSegments = ['recipes', '[id]'];
    rerender({});

    expect(mockScreen).toHaveBeenCalledTimes(2);
    expect(mockScreen).toHaveBeenLastCalledWith('recipes/[id]', {
      pathname: '/recipes/abc',
    });
  });
});
