import { fireEvent, render, screen } from '@testing-library/react-native';
import { Alert } from 'react-native';
import BeanDetailScreen from '@/app/beans/[id]';
import { cancelDegassing } from '@/lib/notifications/degassing';
import { createBean } from './helpers/beanFactory';

const ROUTE_ID = 'bean-1';

const mockUseLocalSearchParams = jest.fn(() => ({ id: ROUTE_ID }));
const mockBack = jest.fn();
const mockPush = jest.fn();
const mockTrack = jest.fn();
const mockMutate = jest.fn();

/**
 * Options the screen hands to `useDeleteBeanMutation`. The production
 * `onSuccess` closure is the only place a post-success cancel can live, so the
 * test captures it and drives it exactly like react-query would.
 */
type DeleteMutationOptions = {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
};

let capturedDeleteOptions: DeleteMutationOptions | undefined;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => mockUseLocalSearchParams(),
  useRouter: () => ({ back: mockBack, push: mockPush, replace: jest.fn() }),
}));

jest.mock('@/hooks/useBeans', () => ({
  useBeanDetail: () => ({ data: mockBeanDetail(), isLoading: false }),
  useDeleteBeanMutation: (options?: DeleteMutationOptions) => {
    capturedDeleteOptions = options;
    return { mutate: mockMutate, isPending: false };
  },
}));

jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({ track: mockTrack }),
}));

jest.mock('@/components/beans', () => ({ BeanDetail: () => null }));
jest.mock('@/lib/notifications/degassing');

const mockBeanDetail = jest.fn(() => createBean({ id: ROUTE_ID }));
const cancelMock = jest.mocked(cancelDegassing);

/** Renders the screen and walks the real UI to the delete confirmation Alert. */
function confirmDeletionThroughUi(): {
  alertArgs: Parameters<typeof Alert.alert>;
} {
  const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

  render(<BeanDetailScreen />);
  fireEvent.press(screen.getByLabelText('더보기 메뉴'));
  fireEvent.press(screen.getByText('삭제'));

  expect(alertSpy).toHaveBeenCalledTimes(1);
  const alertArgs = alertSpy.mock.calls[0] as Parameters<typeof Alert.alert>;
  const buttons = alertArgs[2];
  const destructive = buttons?.find((button) => button.style === 'destructive');

  expect(destructive).toBeDefined();
  destructive?.onPress?.();

  return { alertArgs };
}

describe('BeanDetailScreen deletion notification cancellation', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedDeleteOptions = undefined;
    mockUseLocalSearchParams.mockReturnValue({ id: ROUTE_ID });
    mockBeanDetail.mockReturnValue(createBean({ id: ROUTE_ID }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Given the user confirms deletion', () => {
    it('When the mutation is still in flight, Then the notification is not cancelled yet', () => {
      confirmDeletionThroughUi();

      expect(mockMutate).toHaveBeenCalledTimes(1);
      expect(mockMutate).toHaveBeenCalledWith(ROUTE_ID);
      expect(cancelMock).not.toHaveBeenCalled();
    });

    it('When the deletion succeeds, Then the notification is cancelled exactly once for that bean', () => {
      confirmDeletionThroughUi();

      expect(cancelMock).not.toHaveBeenCalled();

      capturedDeleteOptions?.onSuccess?.();

      expect(cancelMock).toHaveBeenCalledTimes(1);
      expect(cancelMock).toHaveBeenCalledWith(ROUTE_ID);
    });

    it('When the deletion fails, Then the notification survives because success never ran', () => {
      confirmDeletionThroughUi();

      capturedDeleteOptions?.onError?.(new Error('삭제 실패'));

      expect(cancelMock).not.toHaveBeenCalled();
    });

    it('When react-query invokes success twice, Then each invocation cancels the same route bean', () => {
      confirmDeletionThroughUi();

      capturedDeleteOptions?.onSuccess?.();
      capturedDeleteOptions?.onSuccess?.();

      expect(cancelMock).toHaveBeenCalledTimes(2);
      expect(cancelMock).toHaveBeenNthCalledWith(1, ROUTE_ID);
      expect(cancelMock).toHaveBeenNthCalledWith(2, ROUTE_ID);
    });
  });

  describe('Given the user cancels the confirmation', () => {
    it('When the cancel button is pressed, Then neither the mutation nor the cancel runs', () => {
      const { alertArgs } = confirmDeletionThroughUi();
      jest.clearAllMocks();

      const cancelButton = alertArgs[2]?.find((button) => button.style === 'cancel');
      cancelButton?.onPress?.();

      expect(mockMutate).not.toHaveBeenCalled();
      expect(cancelMock).not.toHaveBeenCalled();
    });
  });

  describe('Given the delete flow keeps its existing contract', () => {
    it('When the user confirms, Then the confirmation Alert copy and tracking are unchanged', () => {
      const { alertArgs } = confirmDeletionThroughUi();

      expect(alertArgs[0]).toBe('원두 삭제');
      expect(alertArgs[1]).toBe('이 원두를 삭제하시겠습니까?');
      expect(mockTrack).toHaveBeenCalledWith('bean_deleted', { bean_id: ROUTE_ID });
    });

    it('When the deletion succeeds, Then navigation still goes back', () => {
      confirmDeletionThroughUi();

      capturedDeleteOptions?.onSuccess?.();

      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('When the deletion fails, Then the failure Alert still surfaces the error message', () => {
      confirmDeletionThroughUi();
      const alertSpy = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

      capturedDeleteOptions?.onError?.(new Error('네트워크 오류'));

      expect(alertSpy).toHaveBeenCalledWith('삭제 실패', '네트워크 오류');
      expect(mockBack).not.toHaveBeenCalled();
    });
  });
});
