export interface ReferralOption {
  label: string;
  value: string;
  icon: string;
}

export const REFERRAL_OPTIONS: ReferralOption[] = [
  { label: 'YouTube', value: 'youtube', icon: 'logo-youtube' },
  { label: 'Instagram', value: 'instagram', icon: 'logo-instagram' },
  { label: '친구/지인 추천', value: 'friend_recommendation', icon: 'people-outline' },
  { label: '앱스토어 검색', value: 'appstore_search', icon: 'search-outline' },
  { label: '홈바리스타클럽', value: 'home_barista_club', icon: 'cafe-outline' },
];

export const getReferralLabel = (
  options: ReferralOption[],
  value: string
): string => {
  const option = options.find((opt) => opt.value === value);
  return option ? option.label : value;
};
