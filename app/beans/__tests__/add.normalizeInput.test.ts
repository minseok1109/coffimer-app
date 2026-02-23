import { normalizeInput } from '@/lib/beans/normalizeBeanInput';

describe('normalizeInput', () => {
  it('정규화 규칙에 따라 텍스트/숫자 필드를 변환한다', () => {
    const normalized = normalizeInput({
      name: ' Ethiopia Sidamo ',
      roastery_name: '  Test Roastery  ',
      roast_date: ' 2026-02-18 ',
      opened_date: ' 2026-02-20 ',
      roast_level: 'medium',
      bean_type: 'blend',
      weight_g: 200,
      remaining_g: 120,
      price: 15000,
      cup_notes: ['berry', 123, 'chocolate'],
      degassing_days: '14',
      variety: '   ',
      process_method: '  워시드  ',
      notes: '   ',
    });

    expect(normalized.name).toBe('Ethiopia Sidamo');
    expect(normalized.roastery_name).toBe('Test Roastery');
    expect(normalized.roast_date).toBe('2026-02-18');
    expect(normalized.opened_date).toBe('2026-02-20');
    expect(normalized.remaining_g).toBe(120);
    expect(normalized.degassing_days).toBeNull();
    expect(normalized.variety).toBeNull();
    expect(normalized.process_method).toBe('워시드');
    expect(normalized.notes).toBeNull();
    expect(normalized.cup_notes).toEqual(['berry', 'chocolate']);
  });

  it('degassing_days=0을 유효값으로 유지한다', () => {
    const normalized = normalizeInput({
      name: 'Bean',
      roastery_name: '',
      roast_date: '',
      opened_date: '',
      roast_level: null,
      bean_type: 'single_origin',
      weight_g: 250,
      remaining_g: 0,
      price: null,
      cup_notes: [],
      degassing_days: 0,
      variety: '',
      process_method: null,
      notes: '',
    });

    expect(normalized.degassing_days).toBe(0);
    expect(normalized.opened_date).toBeNull();
  });
});
