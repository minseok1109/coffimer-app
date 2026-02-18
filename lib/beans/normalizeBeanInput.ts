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

export const normalizeInput = (data: Record<string, unknown>): CreateBeanInput => {
  const cupNotes = Array.isArray(data.cup_notes)
    ? data.cup_notes.filter((note): note is string => typeof note === 'string')
    : undefined;

  return {
    name: typeof data.name === 'string' ? data.name.trim() : '',
    roastery_name: normalizeText(data.roastery_name),
    roast_date: normalizeText(data.roast_date),
    roast_level: data.roast_level as CreateBeanInput['roast_level'],
    bean_type: data.bean_type as CreateBeanInput['bean_type'],
    weight_g: data.weight_g as number,
    price: normalizeNumber(data.price),
    cup_notes: cupNotes,
    image_url: normalizeText(data.image_url),
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

const normalizeTextForEdit = (
  data: Record<string, unknown>,
  key: keyof Pick<
    UpdateBeanInput,
    'name' | 'roastery_name' | 'roast_date' | 'variety' | 'process_method' | 'notes'
  >,
): string | null | undefined => {
  if (!(key in data)) return undefined;
  const value = data[key];
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
};

export const normalizeEditInput = (data: Record<string, unknown>): UpdateBeanInput => {
  const input: UpdateBeanInput = {};

  const name = normalizeTextForEdit(data, 'name');
  if (name !== undefined) input.name = name ?? '';

  const roasteryName = normalizeTextForEdit(data, 'roastery_name');
  if (roasteryName !== undefined) input.roastery_name = roasteryName;

  const roastDate = normalizeTextForEdit(data, 'roast_date');
  if (roastDate !== undefined) input.roast_date = roastDate;

  const variety = normalizeTextForEdit(data, 'variety');
  if (variety !== undefined) input.variety = variety;

  const processMethod = normalizeTextForEdit(data, 'process_method');
  if (processMethod !== undefined) input.process_method = processMethod;

  const notes = normalizeTextForEdit(data, 'notes');
  if (notes !== undefined) input.notes = notes;

  if ('roast_level' in data) {
    input.roast_level = data.roast_level as UpdateBeanInput['roast_level'];
  }

  if ('bean_type' in data) {
    input.bean_type = data.bean_type as UpdateBeanInput['bean_type'];
  }

  if ('weight_g' in data && typeof data.weight_g === 'number' && Number.isFinite(data.weight_g)) {
    input.weight_g = data.weight_g;
  }

  if ('price' in data) {
    if (typeof data.price === 'number' && Number.isFinite(data.price)) {
      input.price = data.price;
    } else {
      input.price = null;
    }
  }

  if ('degassing_days' in data) {
    if (typeof data.degassing_days === 'number' && Number.isFinite(data.degassing_days)) {
      input.degassing_days = data.degassing_days;
    } else {
      input.degassing_days = null;
    }
  }

  if ('cup_notes' in data && Array.isArray(data.cup_notes)) {
    input.cup_notes = data.cup_notes.filter((note): note is string => typeof note === 'string');
  }

  if (
    'remaining_g' in data &&
    typeof data.remaining_g === 'number' &&
    Number.isFinite(data.remaining_g)
  ) {
    input.remaining_g = data.remaining_g;
  }

  return input;
};
