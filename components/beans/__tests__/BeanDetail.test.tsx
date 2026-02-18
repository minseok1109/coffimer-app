import { render, screen } from '@testing-library/react-native';
import type { Bean } from '@/types/bean';
import { BeanDetail } from '../BeanDetail';

const createBean = (overrides: Partial<Bean> = {}): Bean => ({
  id: 'bean-1',
  name: '테스트 원두',
  roastery_name: '테스트 로스터리',
  roast_date: '2026-02-01',
  roast_level: 'medium',
  bean_type: 'single_origin',
  weight_g: 200,
  remaining_g: 120,
  price: 18000,
  cup_notes: ['초콜릿'],
  image_url: null,
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
