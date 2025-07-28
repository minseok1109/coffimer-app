export interface FilterOption {
  label: string;
  value: string;
  icon?: string;
}

export const defaultFilterOptions: FilterOption[] = [
  { label: 'V60 종이 필터', value: 'v60_paper', icon: 'funnel-outline' },
  { label: '카펙 아바카 필터', value: 'cafec_abaca', icon: 'funnel-outline' },
  { label: '오리가미 콘 필터', value: 'origami_cone', icon: 'funnel-outline' },
  {
    label: '칼리타 웨이브 185 필터',
    value: 'kalita_wave_185',
    icon: 'funnel-outline',
  },
  {
    label: '칼리타 웨이브 155',
    value: 'kalita_wave_155',
    icon: 'funnel-outline',
  },
];

export const getFilterLabel = (value: string): string => {
  const option = defaultFilterOptions.find((opt) => opt.value === value);
  return option ? option.label : value;
};
