import { render, screen } from '@testing-library/react-native';
import type { Bean } from '@/types/bean';
import { BeanDetail } from '../BeanDetail';

const createBean = (overrides: Partial<Bean> = {}): Bean => ({
  id: 'bean-1',
  name: '테스트 원두',
  roastery_name: '테스트 로스터리',
  roast_date: '2026-02-01',
  opened_date: null,
  roast_level: 'medium',
  bean_type: 'single_origin',
  weight_g: 200,
  remaining_g: 120,
  price: 18000,
  cup_notes: ['초콜릿'],
  images: [],
  user_id: 'user-1',
  created_at: '2026-02-01T00:00:00.000Z',
  degassing_days: null,
  variety: null,
  process_method: null,
  notes: null,
  updated_at: '2026-02-01T00:00:00.000Z',
  ...overrides,
});

describe('BeanDetail', () => {
  it('degassing_days=0이면 즉시 음용 안내를 표시하고 타임라인은 숨긴다', () => {
    render(
      <BeanDetail
        bean={createBean({
          degassing_days: 0,
          roast_date: '2026-02-10',
        })}
      />,
    );

    expect(screen.getByText('디게싱 기간 설정: 0일')).toBeTruthy();
    expect(
      screen.getByText('디게싱 0일 설정으로 즉시 음용 가능 상태입니다.'),
    ).toBeTruthy();
    expect(screen.queryByText('최적기')).toBeNull();
  });

  it('degassing_days만 있고 roast_date가 없으면 타임라인 대신 안내 문구를 표시한다', () => {
    render(
      <BeanDetail
        bean={createBean({
          degassing_days: 14,
          roast_date: null,
        })}
      />,
    );

    expect(screen.getByText('디게싱 기간 설정: 14일')).toBeTruthy();
    expect(
      screen.getByText('로스팅 날짜를 입력하면 디게싱 타임라인이 표시됩니다.'),
    ).toBeTruthy();
    expect(screen.queryByText('최적기')).toBeNull();
  });

  it('원두 정보를 레이블-값 테이블 형태로 표시한다', () => {
    const openedDate = '2026-02-03';
    const formattedOpenedDate = new Date(openedDate).toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    render(
      <BeanDetail
        bean={createBean({
          opened_date: openedDate,
          variety: '게이샤',
          process_method: '워시드',
        })}
      />,
    );

    expect(screen.getByText('가격')).toBeTruthy();
    expect(screen.getByText('용량')).toBeTruthy();
    expect(screen.getByText('원두 유형')).toBeTruthy();
    expect(screen.getByText('로스팅 날짜')).toBeTruthy();
    expect(screen.getByText('개봉일')).toBeTruthy();
    expect(screen.getByText(formattedOpenedDate)).toBeTruthy();
    expect(screen.getByText('배전도')).toBeTruthy();
    expect(screen.getByText('품종')).toBeTruthy();
    expect(screen.getByText('가공 방식')).toBeTruthy();
  });

  it('null 또는 빈 필드의 레이블을 숨긴다', () => {
    render(
      <BeanDetail
        bean={createBean({
          price: null,
          roast_date: null,
          opened_date: null,
          roast_level: null,
          variety: null,
          process_method: null,
        })}
      />,
    );

    // 항상 표시되는 레이블
    expect(screen.getByText('용량')).toBeTruthy();
    expect(screen.getByText('원두 유형')).toBeTruthy();

    // 조건부 레이블은 숨겨져야 함
    expect(screen.queryByText('가격')).toBeNull();
    expect(screen.queryByText('로스팅 날짜')).toBeNull();
    expect(screen.queryByText('개봉일')).toBeNull();
    expect(screen.queryByText('배전도')).toBeNull();
    expect(screen.queryByText('품종')).toBeNull();
    expect(screen.queryByText('가공 방식')).toBeNull();
  });

  it('신규 텍스트 필드를 trim하여 표시하고 공백 메모는 숨긴다', () => {
    const { rerender } = render(
      <BeanDetail
        bean={createBean({
          variety: '  게이샤 ',
          process_method: '  워시드 ',
          notes: '  복숭아 향  ',
        })}
      />,
    );

    expect(screen.getByText('게이샤')).toBeTruthy();
    expect(screen.getByText('워시드')).toBeTruthy();
    expect(screen.getByText('복숭아 향')).toBeTruthy();

    rerender(
      <BeanDetail
        bean={createBean({
          variety: '   ',
          process_method: '   ',
          notes: '   ',
        })}
      />,
    );

    expect(screen.queryByText('메모')).toBeNull();
  });
});
