import { render, screen } from '@testing-library/react-native';
import { BeanCard } from '@/components/beans/BeanCard';
import type { Bean } from '@/types/bean';

function createBean(overrides: Partial<Bean> = {}): Bean {
  return {
    id: 'bean-1',
    name: 'Test Bean',
    roastery_name: 'Test Roastery',
    roast_date: '2026-02-20',
    opened_date: null,
    roast_level: 'medium',
    bean_type: 'single_origin',
    weight_g: 200,
    remaining_g: 150,
    price: 12000,
    cup_notes: [],
    images: [],
    user_id: 'user-1',
    created_at: '2026-02-22T00:00:00Z',
    degassing_days: null,
    variety: null,
    process_method: null,
    notes: null,
    updated_at: '2026-02-22T00:00:00Z',
    ...overrides,
  };
}

describe('BeanCard', () => {
  it('renders primary image', () => {
    render(
      <BeanCard
        bean={createBean({
          images: [
            {
              id: 'img-1',
              bean_id: 'bean-1',
              user_id: 'user-1',
              image_url: 'https://example.com/primary.jpg',
              storage_path: 'path-1',
              sort_order: 0,
              is_primary: true,
              created_at: '2026-02-22T00:00:00Z',
              updated_at: '2026-02-22T00:00:00Z',
            },
            {
              id: 'img-2',
              bean_id: 'bean-1',
              user_id: 'user-1',
              image_url: 'https://example.com/second.jpg',
              storage_path: 'path-2',
              sort_order: 1,
              is_primary: false,
              created_at: '2026-02-22T00:00:00Z',
              updated_at: '2026-02-22T00:00:00Z',
            },
          ],
        })}
      />,
    );

    const image = screen.getByTestId('bean-card-image');
    expect(image.props.source.uri).toBe('https://example.com/primary.jpg');
  });

  it('renders placeholder when no image exists', () => {
    render(<BeanCard bean={createBean({ images: [] })} />);

    expect(screen.getByTestId('bean-card-placeholder')).toBeTruthy();
  });

  describe('디게싱 칩 (로컬 캘린더 기준)', () => {
    // 로컬 달력 2026-01-02 00:30. TZ=Asia/Seoul에서는 2026-01-02T00:30:00+09:00.
    const PINNED_LOCAL_NOW = new Date(2026, 0, 2, 0, 30, 0, 0);

    beforeEach(() => {
      jest.useFakeTimers({ now: PINNED_LOCAL_NOW });
    });

    afterEach(() => {
      jest.useRealTimers();
    });

    it('전날 로스팅된 원두는 경과 1일을 반영한 잔여일수를 칩에 표시한다', () => {
      render(
        <BeanCard bean={createBean({ roast_date: '2026-01-01', degassing_days: 5 })} />,
      );

      expect(screen.getByText('디게싱 중 · 4일 남음')).toBeTruthy();
    });

    it('완료일 당일에는 완료 칩을 표시한다', () => {
      render(
        <BeanCard bean={createBean({ roast_date: '2025-12-28', degassing_days: 5 })} />,
      );

      expect(screen.getByText('디게싱 완료')).toBeTruthy();
      expect(screen.queryByText('디게싱 중 · 1일 남음')).toBeNull();
    });

    it('존재하지 않는 로스팅 날짜는 칩을 렌더하지 않는다', () => {
      render(
        <BeanCard bean={createBean({ roast_date: '2026-02-30', degassing_days: 5 })} />,
      );

      expect(screen.queryByText('디게싱 완료')).toBeNull();
      expect(screen.queryByText(/디게싱 중/)).toBeNull();
    });
  });
});
