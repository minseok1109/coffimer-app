import type { Bean } from '@/types/bean';

export function getDegassingNotificationContent(bean: Pick<Bean, 'id' | 'name'>) {
  return {
    title: '디게싱 완료',
    body: `${bean.name.trim()} 디게싱 기간이 끝났습니다. 맛있게 원두를 즐기세요!`,
    data: { url: `/beans/${bean.id}` },
    sound: 'default',
  };
}
