import type { Control, FieldErrors, UseFormSetValue } from 'react-hook-form';
import type { BeanFormData } from '@/lib/validation/beanSchema';

export interface BeanFormContext {
  control: Control<BeanFormData>;
  errors: FieldErrors<BeanFormData>;
  setValue: UseFormSetValue<BeanFormData>;
  shouldDirty?: boolean;
}
