import { fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import { Alert } from 'react-native';
import AddBeanScreen from '@/app/beans/add';
import { scheduleDegassing } from '@/lib/notifications/degassing';
import type { Bean } from '@/types/bean';
import { createBean } from './helpers/beanFactory';

const mockBack = jest.fn();
const mockTrack = jest.fn();
const mockCreateBean = jest.fn();
const mockCreateBeanWithImages = jest.fn();

/** Options each create mutation receives from the screen. */
type CreateMutationOptions = {
  onSuccess?: (bean: Bean) => void;
  onError?: (error: Error) => void;
};

let capturedCreateOptions: CreateMutationOptions | undefined;
let capturedCreateWithImagesOptions: CreateMutationOptions | undefined;

jest.mock('expo-router', () => ({
  useRouter: () => ({ back: mockBack, push: jest.fn(), replace: jest.fn() }),
}));

jest.mock('@/hooks/useAnalytics', () => ({
  useAnalytics: () => ({ track: mockTrack }),
}));

jest.mock('@/hooks/useBeans', () => ({
  useCreateBeanMutation: (options?: CreateMutationOptions) => {
    capturedCreateOptions = options;
    return { mutateAsync: mockCreateBean, isPending: false };
  },
  useCreateBeanWithImagesMutation: (options?: CreateMutationOptions) => {
    capturedCreateWithImagesOptions = options;
    return { mutateAsync: mockCreateBeanWithImages, isPending: false };
  },
}));

jest.mock('@/components/beans', () => ({
  BeanForm: ({
    onSubmit,
  }: {
    onSubmit: (...args: unknown[]) => Promise<void>;
  }) => {
    const { Pressable, Text } = require('react-native');
    const submit = (imageUris: string[]) => {
      void onSubmit(
        {
          name: '테스트 원두',
          bean_type: 'single_origin',
          weight_g: 200,
          cup_notes: [],
          roast_date: '2026-01-01',
          degassing_days: 14,
        },
        {
          encodedImages: imageUris.length
            ? [{ base64: 'base64-1', mimeType: 'image/jpeg' }]
            : [],
          imageUris,
          primaryIndex: imageUris.length ? 0 : null,
        },
      ).catch(() => undefined);
    };

    return (
      <>
        <Pressable onPress={() => submit([])} testID="submit-plain">
          <Text>plain</Text>
        </Pressable>
        <Pressable onPress={() => submit(['file://one.jpg'])} testID="submit-images">
          <Text>images</Text>
        </Pressable>
      </>
    );
  },
}));

jest.mock('@/lib/notifications/degassing');

jest.mock('@/lib/storage/beanImage', () => ({
  uploadBeanImages: jest.fn(async () => [
    {
      publicUrl: 'https://cdn.example.com/one.jpg',
      storagePath: 'user-1/bean-uuid/one.jpg',
      mimeType: 'image/jpeg',
    },
  ]),
  deleteBeanImagesByPaths: jest.fn(),
}));

jest.mock('expo-crypto', () => ({ randomUUID: jest.fn(() => 'bean-uuid') }));

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: { user: { id: 'user-1' } } },
      })),
    },
  },
}));

const scheduleMock = jest.mocked(scheduleDegassing);
const CREATED_BEAN = createBean({ id: 'created-bean' });

describe('AddBeanScreen degassing scheduling', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    capturedCreateOptions = undefined;
    capturedCreateWithImagesOptions = undefined;
    mockCreateBean.mockResolvedValue(CREATED_BEAN);
    mockCreateBeanWithImages.mockResolvedValue(CREATED_BEAN);
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  describe('Given a bean is created without images', () => {
    it('When the mutation succeeds, Then the returned bean is scheduled exactly once', async () => {
      render(<AddBeanScreen />);
      fireEvent.press(screen.getByTestId('submit-plain'));

      await waitFor(() => expect(mockCreateBean).toHaveBeenCalledTimes(1));

      capturedCreateOptions?.onSuccess?.(CREATED_BEAN);

      expect(scheduleMock).toHaveBeenCalledTimes(1);
      expect(scheduleMock).toHaveBeenCalledWith(CREATED_BEAN);
    });

    it('When the mutation succeeds, Then the success Alert still returns the user back', async () => {
      const alertSpy = jest
        .spyOn(Alert, 'alert')
        .mockImplementation(() => undefined);

      render(<AddBeanScreen />);
      fireEvent.press(screen.getByTestId('submit-plain'));
      await waitFor(() => expect(mockCreateBean).toHaveBeenCalledTimes(1));

      capturedCreateOptions?.onSuccess?.(CREATED_BEAN);

      expect(alertSpy).toHaveBeenCalledWith(
        '등록 완료',
        '원두가 등록되었습니다.',
        expect.any(Array),
      );
      const confirm = alertSpy.mock.calls[0][2]?.[0];
      expect(confirm?.text).toBe('확인');
      confirm?.onPress?.();
      expect(mockBack).toHaveBeenCalledTimes(1);
    });

    it('When the mutation fails, Then the failure Alert runs and nothing is scheduled', () => {
      const alertSpy = jest
        .spyOn(Alert, 'alert')
        .mockImplementation(() => undefined);

      render(<AddBeanScreen />);

      capturedCreateOptions?.onError?.(new Error('boom'));

      expect(alertSpy).toHaveBeenCalledWith(
        '등록 실패',
        '원두 등록 중 오류가 발생했습니다.',
      );
      expect(scheduleMock).not.toHaveBeenCalled();
    });
  });

  describe('Given a bean is created with images', () => {
    it('When the mutation succeeds, Then the returned bean is scheduled exactly once', async () => {
      render(<AddBeanScreen />);
      fireEvent.press(screen.getByTestId('submit-images'));

      await waitFor(() =>
        expect(mockCreateBeanWithImages).toHaveBeenCalledTimes(1),
      );

      capturedCreateWithImagesOptions?.onSuccess?.(CREATED_BEAN);

      expect(scheduleMock).toHaveBeenCalledTimes(1);
      expect(scheduleMock).toHaveBeenCalledWith(CREATED_BEAN);
      expect(mockCreateBean).not.toHaveBeenCalled();
    });

    it('When the mutation fails, Then nothing is scheduled', () => {
      jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);

      render(<AddBeanScreen />);

      capturedCreateWithImagesOptions?.onError?.(new Error('boom'));

      expect(scheduleMock).not.toHaveBeenCalled();
    });
  });
});
