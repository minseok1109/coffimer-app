import { beanFormSchema } from '@/lib/validation/beanSchema';
import { beanToFormData, normalizeEditInput } from '@/lib/beans/normalizeBeanInput';
import type { Bean } from '@/types/bean';

describe('normalizeEditInput', () => {
  it('should not include image_url in output', () => {
    const result = normalizeEditInput({
      name: 'Test Bean',
      image_url: 'https://example.com/image.jpg',
    });
    expect(result).not.toHaveProperty('image_url');
    expect(result.name).toBe('Test Bean');
  });

  it('should normalize whitespace-only text to null', () => {
    const result = normalizeEditInput({
      roastery_name: '   ',
      variety: '',
      notes: '  \n  ',
    });
    expect(result.roastery_name).toBeNull();
    expect(result.variety).toBeNull();
    expect(result.notes).toBeNull();
  });

  it('should only include remaining_g when it is a finite number', () => {
    expect(normalizeEditInput({ remaining_g: 100 }).remaining_g).toBe(100);
    expect(normalizeEditInput({ remaining_g: NaN })).not.toHaveProperty('remaining_g');
    expect(normalizeEditInput({ remaining_g: Infinity })).not.toHaveProperty('remaining_g');
    expect(normalizeEditInput({})).not.toHaveProperty('remaining_g');
  });

  it('should not include system fields (user_id, created_at, updated_at)', () => {
    const result = normalizeEditInput({
      name: 'Test',
      user_id: 'user-123',
      created_at: '2024-01-01',
      updated_at: '2024-01-02',
    });
    expect(result).not.toHaveProperty('user_id');
    expect(result).not.toHaveProperty('created_at');
    expect(result).not.toHaveProperty('updated_at');
  });
});

describe('beanFormSchema cross-validation', () => {
  it('should reject when remaining_g exceeds weight_g', () => {
    const result = beanFormSchema.safeParse({
      name: 'Test',
      bean_type: 'blend',
      weight_g: 200,
      cup_notes: [],
      remaining_g: 300,
    });
    expect(result.success).toBe(false);
    if (!result.success) {
      const remainingError = result.error.issues.find(
        (issue) => issue.path.includes('remaining_g')
      );
      expect(remainingError).toBeDefined();
      expect(remainingError?.message).toBe('잔여량은 전체 무게를 초과할 수 없습니다');
    }
  });

  it('should accept when remaining_g equals weight_g', () => {
    const result = beanFormSchema.safeParse({
      name: 'Test',
      bean_type: 'blend',
      weight_g: 200,
      cup_notes: [],
      remaining_g: 200,
    });
    expect(result.success).toBe(true);
  });
});

describe('beanToFormData', () => {
  it('should convert nullable fields to form-friendly values', () => {
    const bean: Bean = {
      id: '1',
      name: 'Test Bean',
      roastery_name: null,
      roast_date: null,
      roast_level: null,
      bean_type: 'blend',
      weight_g: 200,
      remaining_g: 150,
      price: null,
      cup_notes: [],
      images: [],
      user_id: 'user-1',
      created_at: '2024-01-01',
      degassing_days: null,
      variety: null,
      process_method: null,
      notes: null,
      updated_at: '2024-01-01',
    };

    const result = beanToFormData(bean);
    expect(result.roastery_name).toBe('');
    expect(result.roast_date).toBe('');
    expect(result.variety).toBe('');
    expect(result.notes).toBe('');
    expect(result.remaining_g).toBe(150);
    expect(result).not.toHaveProperty('image_url');
    expect(result).not.toHaveProperty('user_id');
  });
});
