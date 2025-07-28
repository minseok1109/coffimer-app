export interface DripperOption {
  label: string;
  value: string;
  icon?: string;
}

export const defaultDripperOptions: DripperOption[] = [
  { label: 'V60', value: 'v60', icon: 'funnel-outline' },
  { label: '칼리타', value: 'kalita', icon: 'funnel-outline' },
  { label: '케멕스', value: 'chemex', icon: 'funnel-outline' },
  { label: '하리오', value: 'hario', icon: 'funnel-outline' },
  { label: '오리가미', value: 'origami', icon: 'funnel-outline' },
  { label: '솔로 드리퍼', value: 'solo', icon: 'funnel-outline' },
];

export const getDripperLabel = (value: string): string => {
  const option = defaultDripperOptions.find((opt) => opt.value === value);
  return option ? option.label : value;
};
