import { analyzeBeanImages } from '@/lib/api/beanAnalysis';
import { supabase } from '@/lib/supabaseClient';

jest.mock('@/lib/supabaseClient', () => ({
  supabase: {
    functions: {
      invoke: jest.fn(),
    },
  },
}));

const mockInvoke = supabase.functions.invoke as jest.Mock;

describe('analyzeBeanImages', () => {
  const singleImage = [{ base64: 'dGVzdA==', mimeType: 'image/jpeg' as const }];

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('sends images array and currentDate to edge function once', async () => {
    const images = Array.from({ length: 3 }, () => singleImage[0]);

    mockInvoke.mockResolvedValueOnce({
      data: { success: true, data: { name: 'Bean', confidence: {} } },
      error: null,
    });

    await analyzeBeanImages(images, '2026-02-22');

    expect(mockInvoke).toHaveBeenCalledTimes(1);
    expect(mockInvoke).toHaveBeenCalledWith('extract-bean-info', {
      body: { images, currentDate: '2026-02-22' },
    });
  });

  it('omits currentDate from body when not provided', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: true, data: { name: 'Bean', confidence: {} } },
      error: null,
    });

    await analyzeBeanImages(singleImage);

    const invokedBody = mockInvoke.mock.calls[0][1].body;
    expect(invokedBody).not.toHaveProperty('currentDate');
  });

  it('throws when images is empty', async () => {
    await expect(analyzeBeanImages([])).rejects.toThrow('최소 1장의 이미지가 필요합니다.');
  });

  it('throws when invoke returns error', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: new Error('Function error'),
    });

    await expect(analyzeBeanImages(singleImage)).rejects.toThrow('Function error');
  });

  it('throws invoke context error details when available', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: null,
      error: {
        message: 'Edge Function returned a non-2xx status code',
        context: {
          json: async () => ({
            error: 'OpenRouter API call failed',
            details: 'request timed out',
          }),
        },
      },
    });

    await expect(analyzeBeanImages(singleImage)).rejects.toThrow(
      'OpenRouter API call failed: request timed out',
    );
  });

  it('throws when success flag is false', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: { success: false, error: 'LLM timeout' },
      error: null,
    });

    await expect(analyzeBeanImages(singleImage)).rejects.toThrow('LLM timeout');
  });

  it('includes server details when success flag is false', async () => {
    mockInvoke.mockResolvedValueOnce({
      data: {
        success: false,
        error: 'OpenRouter API call failed',
        details: 'upstream unavailable',
      },
      error: null,
    });

    await expect(analyzeBeanImages(singleImage)).rejects.toThrow(
      'OpenRouter API call failed: upstream unavailable',
    );
  });
});
