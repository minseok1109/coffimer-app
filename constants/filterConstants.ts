export interface FilterOption {
  label: string;
  value: string;
  icon?: string;
}

export interface FilterState {
  brewingType: 'all' | 'hot' | 'ice';
  dripper: string[];
  filter: string[];
}

// 추출 타입 옵션
export const brewingTypeOptions: FilterOption[] = [
  { label: '전체', value: 'all', icon: 'cafe-outline' },
  { label: '핫', value: 'hot', icon: 'thermometer-outline' },
  { label: '아이스', value: 'ice', icon: 'snow-outline' },
];

// 드리퍼 옵션 (실제 DB 값 기반으로 정규화)
export const dripperOptions: FilterOption[] = [
  { label: 'V60', value: 'v60', icon: 'funnel-outline' },
  { label: '오리가미', value: 'origami', icon: 'funnel-outline' },
  { label: '솔로 드리퍼', value: 'solo', icon: 'funnel-outline' },
  { label: '하리오', value: 'hario', icon: 'funnel-outline' },
  { label: '기타', value: 'other', icon: 'funnel-outline' },
];

// 필터 옵션 (실제 DB 값 기반으로 정규화)
export const filterOptions: FilterOption[] = [
  { label: '카펙 아바카', value: 'cafec_abaca', icon: 'funnel-outline' },
  { label: '칼리타 웨이브', value: 'kalita_wave', icon: 'funnel-outline' },
  { label: 'V60 전용', value: 'v60_paper', icon: 'funnel-outline' },
  { label: '오리가미 콘', value: 'origami_cone', icon: 'funnel-outline' },
  { label: '필터 없음', value: 'none', icon: 'close-outline' },
];

// DB 값을 필터 옵션으로 매핑하는 함수
export const mapDripperToFilter = (dripper: string | null): string => {
  if (!dripper) return 'other';
  
  const lowerDripper = dripper.toLowerCase();
  
  if (lowerDripper.includes('v60')) return 'v60';
  if (lowerDripper.includes('오리가미') || lowerDripper.includes('origami')) return 'origami';
  if (lowerDripper.includes('솔로')) return 'solo';
  if (lowerDripper.includes('하리오') || lowerDripper.includes('hario')) return 'hario';
  
  return 'other';
};

export const mapFilterToFilter = (filter: string | null): string => {
  if (!filter) return 'none';
  
  const lowerFilter = filter.toLowerCase();
  
  if (lowerFilter.includes('카펙') || lowerFilter.includes('cafec') || lowerFilter.includes('아바카') || lowerFilter.includes('abaca')) return 'cafec_abaca';
  if (lowerFilter.includes('칼리타') || lowerFilter.includes('kalita') || lowerFilter.includes('웨이브') || lowerFilter.includes('wave')) return 'kalita_wave';
  if (lowerFilter.includes('v60') || lowerFilter.includes('전용')) return 'v60_paper';
  if (lowerFilter.includes('오리가미') || lowerFilter.includes('origami') || lowerFilter.includes('콘')) return 'origami_cone';
  
  return 'none';
};

// 필터 옵션에서 라벨 가져오기
export const getFilterLabel = (options: FilterOption[], value: string): string => {
  const option = options.find(opt => opt.value === value);
  return option ? option.label : value;
};

// 초기 필터 상태
export const initialFilterState: FilterState = {
  brewingType: 'all',
  dripper: [],
  filter: [],
};