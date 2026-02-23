import type { Bean, CreateBeanInput, UpdateBeanInput } from '@/types/bean';
import type { BeanFormData } from '@/lib/validation/beanSchema';

export const normalizeText = (value: unknown): string | null => {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

const normalizeNumber = (value: unknown): number | null => {
  if (typeof value !== 'number') return null;
  return Number.isFinite(value) ? value : null;
};

const isFiniteNumber = (value: unknown): value is number =>
  typeof value === 'number' && Number.isFinite(value);

const normalizeOptionalText = (
  data: Record<string, unknown>,
  key: string,
): string | null | undefined => {
  if (!(key in data)) return undefined;
  return normalizeText(data[key]);
};

export const normalizeInput = (data: Record<string, unknown>): CreateBeanInput => {
  const cupNotes = Array.isArray(data.cup_notes)
    ? data.cup_notes.filter((note): note is string => typeof note === 'string')
    : undefined;

  return {
    name: typeof data.name === 'string' ? data.name.trim() : '',
    roastery_name: normalizeText(data.roastery_name),
    roast_date: normalizeText(data.roast_date),
    opened_date: normalizeText(data.opened_date),
    roast_level: data.roast_level as CreateBeanInput['roast_level'],
    bean_type: data.bean_type as CreateBeanInput['bean_type'],
    weight_g: isFiniteNumber(data.weight_g) ? data.weight_g : 0,
    remaining_g: isFiniteNumber(data.remaining_g) ? data.remaining_g : undefined,
    price: normalizeNumber(data.price),
    cup_notes: cupNotes,
    degassing_days: normalizeNumber(data.degassing_days),
    variety: normalizeText(data.variety),
    process_method: normalizeText(data.process_method),
    notes: normalizeText(data.notes),
  };
};

export const beanToFormData = (bean: Bean): BeanFormData => ({
  name: bean.name,
  roastery_name: bean.roastery_name ?? '',
  roast_date: bean.roast_date ?? '',
  opened_date: bean.opened_date ?? '',
  roast_level: bean.roast_level,
  bean_type: bean.bean_type,
  weight_g: bean.weight_g,
  price: bean.price,
  cup_notes: bean.cup_notes ?? [],
  degassing_days: bean.degassing_days,
  variety: bean.variety ?? '',
  process_method: bean.process_method,
  notes: bean.notes ?? '',
  remaining_g: bean.remaining_g,
});

const TEXT_FIELDS = [
  'roastery_name', 'roast_date', 'opened_date',
  'variety', 'process_method', 'notes',
] as const;

const NULLABLE_NUMBER_FIELDS = ['price', 'degassing_days'] as const;

export const normalizeEditInput = (data: Record<string, unknown>): UpdateBeanInput => {
  const input: UpdateBeanInput = {};

  const name = normalizeOptionalText(data, 'name');
  if (name !== undefined) input.name = name ?? '';

  for (const field of TEXT_FIELDS) {
    const value = normalizeOptionalText(data, field);
    if (value !== undefined) {
      (input as Record<string, unknown>)[field] = value;
    }
  }

  if ('roast_level' in data) {
    input.roast_level = data.roast_level as UpdateBeanInput['roast_level'];
  }

  if ('bean_type' in data) {
    input.bean_type = data.bean_type as UpdateBeanInput['bean_type'];
  }

  if ('weight_g' in data && isFiniteNumber(data.weight_g)) {
    input.weight_g = data.weight_g;
  }

  for (const field of NULLABLE_NUMBER_FIELDS) {
    if (field in data) {
      (input as Record<string, unknown>)[field] = normalizeNumber(data[field]);
    }
  }

  if ('cup_notes' in data && Array.isArray(data.cup_notes)) {
    input.cup_notes = data.cup_notes.filter(
      (note): note is string => typeof note === 'string',
    );
  }

  if ('remaining_g' in data && isFiniteNumber(data.remaining_g)) {
    input.remaining_g = data.remaining_g;
  }

  return input;
};
