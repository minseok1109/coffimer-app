import { render, screen } from '@testing-library/react-native';
import { BeanCard } from '@/components/beans/BeanCard';
import type { Bean } from '@/types/bean';

function createBean(overrides: Partial<Bean> = {}): Bean {
  return {
    id: 'bean-1',
    name: 'Test Bean',
    roastery_name: 'Test Roastery',
    roast_date: '2026-02-20',
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
});
