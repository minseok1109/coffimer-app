import { fireEvent, render, waitFor } from '@testing-library/react-native';
import React from 'react';
import AddBeanScreen from '@/app/beans/add';
import {
  deleteBeanImagesByPaths,
  uploadBeanImages,
} from '@/lib/storage/beanImage';

const mockCreateBean = jest.fn();
const mockCreateBeanWithImages = jest.fn();

jest.mock('@/components/beans', () => ({
  BeanForm: ({ onSubmit }: { onSubmit: (...args: unknown[]) => Promise<void> }) => {
    const { Pressable, Text } = require('react-native');

    return (
      <Pressable
        testID="submit-bean"
        onPress={() => {
          void onSubmit(
            {
              name: '테스트 원두',
              bean_type: 'single_origin',
              weight_g: 200,
              cup_notes: [],
            },
            {
              encodedImages: [{ base64: 'base64-1', mimeType: 'image/jpeg' }],
              imageUris: ['file://one.jpg'],
              primaryIndex: 0,
            },
          ).catch(() => undefined);
        }}
      >
        <Text>submit</Text>
      </Pressable>
    );
  },
}));

jest.mock('@/hooks/useBeans', () => ({
  useCreateBeanMutation: () => ({
    mutateAsync: mockCreateBean,
    isPending: false,
  }),
  useCreateBeanWithImagesMutation: () => ({
    mutateAsync: mockCreateBeanWithImages,
    isPending: false,
  }),
}));

jest.mock('@/lib/storage/beanImage', () => ({
  uploadBeanImages: jest.fn(),
  deleteBeanImagesByPaths: jest.fn(),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(() => 'bean-uuid'),
}));

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    auth: {
      getSession: jest.fn(async () => ({
        data: { session: { user: { id: 'user-1' } } },
      })),
    },
  },
}));

describe('AddBeanScreen multi image flow', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls createBeanWithImages after successful upload', async () => {
    (uploadBeanImages as jest.Mock).mockResolvedValueOnce([
      {
        publicUrl: 'https://cdn.example.com/one.jpg',
        storagePath: 'user-1/bean-uuid/one.jpg',
        mimeType: 'image/jpeg',
      },
    ]);
    mockCreateBeanWithImages.mockResolvedValueOnce({ id: 'bean-uuid' });

    const { getByTestId } = render(<AddBeanScreen />);
    fireEvent.press(getByTestId('submit-bean'));

    await waitFor(() => {
      expect(mockCreateBeanWithImages).toHaveBeenCalledTimes(1);
    });

    expect(mockCreateBean).not.toHaveBeenCalled();
  });

  it('does not call RPC when upload fails', async () => {
    (uploadBeanImages as jest.Mock).mockRejectedValueOnce(new Error('upload failed'));

    const { getByTestId } = render(<AddBeanScreen />);
    fireEvent.press(getByTestId('submit-bean'));

    await waitFor(() => {
      expect(mockCreateBeanWithImages).not.toHaveBeenCalled();
    });
  });

  it('rolls back uploaded files when RPC fails', async () => {
    (uploadBeanImages as jest.Mock).mockResolvedValueOnce([
      {
        publicUrl: 'https://cdn.example.com/one.jpg',
        storagePath: 'user-1/bean-uuid/one.jpg',
        mimeType: 'image/jpeg',
      },
    ]);
    mockCreateBeanWithImages.mockRejectedValueOnce(new Error('rpc failed'));

    const { getByTestId } = render(<AddBeanScreen />);
    fireEvent.press(getByTestId('submit-bean'));

    await waitFor(() => {
      expect(deleteBeanImagesByPaths).toHaveBeenCalledWith([
        'user-1/bean-uuid/one.jpg',
      ]);
    });
  });
});
