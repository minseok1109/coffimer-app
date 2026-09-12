import { render } from '@testing-library/react-native';
import BeanEditPage from '@/app/beans/edit/[id]';
import { rescheduleDegassing } from '@/lib/notifications/degassing';
import type { Bean } from '@/types/bean';
import { createBean } from './helpers/beanFactory';

const ROUTE_ID = 'bean-1';

const mockReplace = jest.fn();
const mockBack = jest.fn();
const mockMutateAsync = jest.fn();

/** Options the edit screen hands to `useUpdateBeanMutation`. */
type UpdateMutationOptions = {
  onSuccess?: (bean: Bean) => void;
  onError?: (error: Error) => void;
};

let capturedUpdateOptions: UpdateMutationOptions | undefined;

jest.mock('expo-router', () => ({
  useLocalSearchParams: () => ({ id: ROUTE_ID }),
  useRouter: () => ({ replace: mockReplace, back: mockBack, push: jest.fn() }),
}));

jest.mock('@/hooks/useBeans', () => ({
  useBeanDetail: () => ({ data: mockBeanDetail(), isLoading: false }),
  useUpdateBeanMutation: (options?: UpdateMutationOptions) => {
    capturedUpdateOptions = options;
    return { mutateAsync: mockMutateAsync, isPending: false };
  },
}));

jest.mock('@/components/beans', () => ({ BeanEditForm: () => null }));
jest.mock('@/lib/notifications/degassing');

const mockBeanDetail = jest.fn(() => createBean({ id: ROUTE_ID }));
const rescheduleMock = jest.mocked(rescheduleDegassing);

const UPDATED_BEAN = createBean({ id: ROUTE_ID, degassing_days: 21 });

describe('BeanEditPage degassing rescheduling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedUpdateOptions = undefined;
    mockBeanDetail.mockReturnValue(createBean({ id: ROUTE_ID }));
  });

  describe('Given an edit is saved', () => {
    it('When the update succeeds, Then the updated bean is rescheduled exactly once', () => {
      render(<BeanEditPage />);

      capturedUpdateOptions?.onSuccess?.(UPDATED_BEAN);

      expect(rescheduleMock).toHaveBeenCalledTimes(1);
      expect(rescheduleMock).toHaveBeenCalledWith(UPDATED_BEAN);
    });

    it('When the update succeeds, Then navigation still replaces to the route bean detail', () => {
      render(<BeanEditPage />);

      capturedUpdateOptions?.onSuccess?.(UPDATED_BEAN);

      expect(mockReplace).toHaveBeenCalledTimes(1);
      expect(mockReplace).toHaveBeenCalledWith(`/beans/${ROUTE_ID}`);
    });

    it('When the update succeeds, Then rescheduling happens before navigation', () => {
      const order: string[] = [];
      rescheduleMock.mockImplementation(async () => {
        order.push('reschedule');
        return null;
      });
      mockReplace.mockImplementation(() => {
        order.push('replace');
      });

      render(<BeanEditPage />);

      capturedUpdateOptions?.onSuccess?.(UPDATED_BEAN);

      expect(order).toEqual(['reschedule', 'replace']);
    });
  });

  describe('Given the mutation contract must stay single-path on errors', () => {
    it('When the screen wires the mutation, Then no onError handler is registered', () => {
      render(<BeanEditPage />);

      expect(capturedUpdateOptions?.onError).toBeUndefined();
    });

    it('When rescheduling rejects, Then the save is not rolled back and nothing throws', async () => {
      // The screen fires this promise without awaiting it, so the test owns the
      // rejection handler; attaching it here keeps best-effort semantics intact
      // without turning a swallowed notification failure into a test crash.
      const rejected = Promise.reject(new Error('notification down'));
      const settled = rejected.catch(() => null);
      rescheduleMock.mockReturnValue(rejected);

      render(<BeanEditPage />);

      expect(() => capturedUpdateOptions?.onSuccess?.(UPDATED_BEAN)).not.toThrow();
      expect(mockReplace).toHaveBeenCalledWith(`/beans/${ROUTE_ID}`);
      await expect(settled).resolves.toBeNull();
    });
  });

  describe('Given the bean is missing', () => {
    it('When the detail query returns nothing, Then nothing is rescheduled on render', () => {
      mockBeanDetail.mockReturnValue(null as unknown as Bean);

      render(<BeanEditPage />);

      expect(rescheduleMock).not.toHaveBeenCalled();
    });
  });
});
