import { act, renderHook } from '@testing-library/react-native';
import { analyzeBeanImages } from '@/lib/api/beanAnalysis';
import { useBeanAnalysis } from '@/hooks/useBeanAnalysis';

jest.mock('@/lib/api/beanAnalysis', () => ({
  analyzeBeanImages: jest.fn(),
}));

jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: jest.fn(() => ({
      resize: jest.fn().mockReturnThis(),
      renderAsync: jest.fn(async () => ({
        saveAsync: jest.fn(async () => ({ base64: 'encoded-base64' })),
      })),
    })),
  },
}));

describe('useBeanAnalysis multi-image', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('encodes image array and calls API once', async () => {
    (analyzeBeanImages as jest.Mock).mockResolvedValueOnce({
      name: 'Extracted Bean',
      roastery_name: null,
      roast_level: null,
      bean_type: null,
      weight_g: null,
      price: null,
      cup_notes: [],
      roast_date: null,
      variety: null,
      process_method: null,
      confidence: { name: 0.9 },
    });

    const { result } = renderHook(() => useBeanAnalysis());

    await act(async () => {
      await result.current.analyze(['file://1.jpg', 'file://2.jpg']);
    });

    expect(analyzeBeanImages).toHaveBeenCalledTimes(1);
    expect((analyzeBeanImages as jest.Mock).mock.calls[0][0]).toHaveLength(2);
    expect((analyzeBeanImages as jest.Mock).mock.calls[0][1]).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(result.current.extractedData?.name).toBe('Extracted Bean');
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('sets error when analysis fails', async () => {
    (analyzeBeanImages as jest.Mock).mockRejectedValueOnce(new Error('Timeout'));

    const { result } = renderHook(() => useBeanAnalysis());

    await act(async () => {
      await expect(result.current.analyze(['file://1.jpg'])).rejects.toThrow(
        'Timeout',
      );
    });

    expect(result.current.error).toBe('Timeout');
    expect(result.current.isAnalyzing).toBe(false);
  });

  it('throws and sets error when no image uri is provided', async () => {
    const { result } = renderHook(() => useBeanAnalysis());

    await act(async () => {
      await expect(result.current.analyze([])).rejects.toThrow(
        '최소 1장의 이미지가 필요합니다.',
      );
    });

    expect(result.current.error).toBe('최소 1장의 이미지가 필요합니다.');
  });
});
