import {
  deleteBeanImagesByPaths,
  uploadBeanImages,
} from '@/lib/storage/beanImage';
import { supabase } from '@/lib/supabaseClient';
import { randomUUID } from 'expo-crypto';

jest.mock('base64-arraybuffer', () => ({
  decode: jest.fn(() => new ArrayBuffer(8)),
}));

jest.mock('expo-crypto', () => ({
  randomUUID: jest.fn(),
}));

const mockUpload = jest.fn();
const mockGetPublicUrl = jest.fn();
const mockRemove = jest.fn();

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    storage: {
      from: jest.fn(() => ({
        upload: mockUpload,
        getPublicUrl: mockGetPublicUrl,
        remove: mockRemove,
      })),
    },
  },
}));

describe('uploadBeanImages', () => {
  const images = [
    { base64: 'img1==', mimeType: 'image/jpeg' },
    { base64: 'img2==', mimeType: 'image/png' },
    { base64: 'img3==', mimeType: 'image/jpeg' },
  ];

  beforeEach(() => {
    jest.clearAllMocks();
    (randomUUID as jest.Mock)
      .mockReturnValueOnce('uuid-1')
      .mockReturnValueOnce('uuid-2')
      .mockReturnValueOnce('uuid-3');
  });

  it('returns uploaded image url/path list on success', async () => {
    mockUpload.mockResolvedValue({ error: null });
    mockGetPublicUrl
      .mockReturnValueOnce({ data: { publicUrl: 'https://cdn/1.jpg' } })
      .mockReturnValueOnce({ data: { publicUrl: 'https://cdn/2.png' } })
      .mockReturnValueOnce({ data: { publicUrl: 'https://cdn/3.jpg' } });

    const result = await uploadBeanImages(images, 'user-1', 'bean-1');

    expect(result).toHaveLength(3);
    expect(result[0]).toMatchObject({
      publicUrl: 'https://cdn/1.jpg',
      storagePath: 'user-1/bean-1/uuid-1.jpg',
    });
  });

  it('rolls back uploaded files when one upload fails', async () => {
    mockUpload
      .mockResolvedValueOnce({ error: null })
      .mockResolvedValueOnce({ error: new Error('upload failed') })
      .mockResolvedValueOnce({ error: null });

    mockGetPublicUrl
      .mockReturnValueOnce({ data: { publicUrl: 'https://cdn/1.jpg' } })
      .mockReturnValueOnce({ data: { publicUrl: 'https://cdn/3.jpg' } });

    mockRemove.mockResolvedValue({ error: null });

    await expect(uploadBeanImages(images, 'user-1', 'bean-1')).rejects.toThrow('upload failed');

    expect(mockRemove).toHaveBeenCalledWith([
      'user-1/bean-1/uuid-1.jpg',
      'user-1/bean-1/uuid-3.jpg',
    ]);
  });
});

describe('deleteBeanImagesByPaths', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('calls remove when paths are provided', async () => {
    mockRemove.mockResolvedValue({ error: null });

    await deleteBeanImagesByPaths(['a.jpg', 'b.png']);

    expect(mockRemove).toHaveBeenCalledWith(['a.jpg', 'b.png']);
  });

  it('does nothing for empty paths', async () => {
    await deleteBeanImagesByPaths([]);

    expect(mockRemove).not.toHaveBeenCalled();
  });
});
