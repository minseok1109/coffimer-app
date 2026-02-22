import { render, screen } from '@testing-library/react-native';
import type { Bean } from '@/types/bean';
import { BeanDetail } from '@/components/beans/BeanDetail';

function createBean(overrides: Partial<Bean> = {}): Bean {
  return {
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
    images: [],
    user_id: 'user-1',
    created_at: '2026-02-01T00:00:00.000Z',
    degassing_days: null,
    variety: null,
    process_method: null,
    notes: null,
    updated_at: '2026-02-01T00:00:00.000Z',
    ...overrides,
  };
}

describe('BeanDetail gallery', () => {
  it('shows page counter and renders first image', () => {
    render(
      <BeanDetail
        bean={createBean({
          images: [
            {
              id: 'img-primary',
              bean_id: 'bean-1',
              user_id: 'user-1',
              image_url: 'https://example.com/primary.jpg',
              storage_path: 'path-primary',
              sort_order: 2,
              is_primary: true,
              created_at: '2026-02-22T00:00:00Z',
              updated_at: '2026-02-22T00:00:00Z',
            },
            {
              id: 'img-second',
              bean_id: 'bean-1',
              user_id: 'user-1',
              image_url: 'https://example.com/second.jpg',
              storage_path: 'path-second',
              sort_order: 0,
              is_primary: false,
              created_at: '2026-02-22T00:00:00Z',
              updated_at: '2026-02-22T00:00:00Z',
            },
          ],
        })}
      />,
    );

    expect(screen.getByTestId('bean-detail-counter')).toBeTruthy();
    expect(screen.getByText('1/2')).toBeTruthy();

    const image = screen.getByTestId('bean-detail-image-0');
    expect(image.props.source.uri).toBe('https://example.com/primary.jpg');
  });
});
