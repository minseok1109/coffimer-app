/**
 * 선택 옵션을 위한 공통 인터페이스
 */
export interface SelectOption {
  label: string;
  value: string;
}

/**
 * 선택된 옵션의 라벨을 반환하는 공통 함수
 * @param options 선택 가능한 옵션들
 * @param selectedValue 현재 선택된 값
 * @param placeholder 선택되지 않았을 때 표시할 텍스트
 * @returns 선택된 옵션의 라벨 또는 placeholder
 */
export const getSelectedOptionLabel = (
  options: SelectOption[],
  selectedValue: string | undefined,
  placeholder: string
): string => {
  if (!selectedValue) return placeholder;

  // 미리 정의된 옵션에서 찾기
  const selectedOption = options.find(
    (option) => option.value === selectedValue
  );

  // 미리 정의된 옵션에서 찾은 경우 해당 label 반환
  if (selectedOption) {
    return selectedOption.label;
  }

  // 미리 정의된 옵션에 없지만 값이 있는 경우 (사용자 직접 입력) 그 값을 그대로 반환
  return selectedValue;
};

/**
 * 드리퍼 옵션 상수
 */
export const DRIPPER_OPTIONS: SelectOption[] = [
  { label: 'V60', value: 'v60' },
  { label: '칼리타', value: 'kalita' },
  { label: '케멕스', value: 'chemex' },
  { label: '하리오', value: 'hario' },
  { label: '오리가미', value: 'origami' },
  { label: '솔로 드리퍼', value: 'solo' },
];

/**
 * 필터 옵션 상수
 */
export const FILTER_OPTIONS: SelectOption[] = [
  { label: 'V60 종이 필터', value: 'v60_paper' },
  { label: '카펙 아바카 필터', value: 'cafec_abaca' },
  { label: '오리가미 콘 필터', value: 'origami_cone' },
  { label: '칼리타 웨이브 185 필터', value: 'kalita_wave_185' },
  { label: '칼리타 웨이브 155', value: 'kalita_wave_155' },
  { label: 'V60 전용 필터', value: 'v60_exclusive' },
];
