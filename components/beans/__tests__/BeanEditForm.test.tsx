import { fireEvent, render, screen } from '@testing-library/react-native';
import type { Bean } from '@/types/bean';
import { BeanEditForm } from '@/components/beans/BeanEditForm';

jest.mock('@/components/beans/RoastDateSelector', () => ({
  RoastDateSelector: () => null,
}));

jest.mock('@/components/beans/RoastLevelSelector', () => ({
  RoastLevelSelector: () => null,
}));

const createBean = (overrides: Partial<Bean> = {}): Bean => ({
  id: 'bean-1',
  name: '테스트 원두',
  roastery_name: '테스트 로스터리',
  roast_date: '2026-02-10',
  opened_date: '2026-02-09',
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

describe('BeanEditForm', () => {
  it('shows opened_date validation message when opened date is earlier than roast date', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);

    render(<BeanEditForm bean={createBean()} onCancel={jest.fn()} onSubmit={onSubmit} />);

    fireEvent.press(screen.getByText('저장하기'));

    expect(onSubmit).not.toHaveBeenCalled();
    expect(await screen.findByText('개봉일은 로스팅 날짜보다 빠를 수 없습니다')).toBeTruthy();
  });
});
