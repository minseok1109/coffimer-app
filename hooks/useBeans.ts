import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { BeanAPI } from '@/lib/api/beans';
import { useAuth } from '@/hooks/useAuth';
import type {
  Bean,
  CreateBeanImageInput,
  CreateBeanInput,
  UpdateBeanInput,
} from '@/types/bean';

export const beanKeys = {
  all: ['beans'] as const,
  lists: () => [...beanKeys.all, 'list'] as const,
  userBeans: (userId: string) => [...beanKeys.lists(), userId] as const,
  details: () => [...beanKeys.all, 'detail'] as const,
  detail: (id: string) => [...beanKeys.details(), id] as const,
};

// 사용자의 원두 목록 조회
export const useUserBeans = () => {
  const { user } = useAuth();
  return useQuery<Bean[], Error>({
    queryKey: beanKeys.userBeans(user?.id ?? ''),
    queryFn: () => BeanAPI.getUserBeans(user!.id),
    enabled: !!user?.id,
  });
};

// 원두 상세 조회
export const useBeanDetail = (beanId: string) => {
  return useQuery<Bean | null, Error>({
    queryKey: beanKeys.detail(beanId),
    queryFn: () => BeanAPI.getBeanById(beanId),
    enabled: !!beanId,
  });
};

// 원두 생성
export const useCreateBeanMutation = (options?: {
  onSuccess?: (bean: Bean) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (input: CreateBeanInput): Promise<Bean> => {
      if (!user) throw new Error('사용자 인증이 필요합니다.');
      return BeanAPI.createBean(input, user.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: beanKeys.userBeans(user?.id ?? ''),
      });
      queryClient.setQueryData(beanKeys.detail(data.id), data);
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
};

export const useCreateBeanWithImagesMutation = (options?: {
  onSuccess?: (bean: Bean) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      beanId,
      input,
      images,
    }: {
      beanId: string;
      input: CreateBeanInput;
      images: CreateBeanImageInput[];
    }): Promise<Bean> => {
      if (!user) throw new Error('사용자 인증이 필요합니다.');
      return BeanAPI.createBeanWithImages(beanId, input, images, user.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: beanKeys.userBeans(user?.id ?? ''),
      });
      queryClient.setQueryData(beanKeys.detail(data.id), data);
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
};

// 원두 수정
export const useUpdateBeanMutation = (options?: {
  onSuccess?: (bean: Bean) => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      beanId,
      input,
    }: {
      beanId: string;
      input: UpdateBeanInput;
    }): Promise<Bean> => {
      if (!user) throw new Error('사용자 인증이 필요합니다.');
      return BeanAPI.updateBean(beanId, input, user.id);
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({
        queryKey: beanKeys.userBeans(user?.id ?? ''),
      });
      queryClient.setQueryData(beanKeys.detail(data.id), data);
      options?.onSuccess?.(data);
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
};

// 원두 삭제 (soft delete)
export const useDeleteBeanMutation = (options?: {
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async (beanId: string): Promise<void> => {
      if (!user) throw new Error('사용자 인증이 필요합니다.');
      return BeanAPI.deleteBean(beanId);
    },
    onSuccess: (_, beanId) => {
      queryClient.removeQueries({ queryKey: beanKeys.detail(beanId) });
      queryClient.invalidateQueries({
        queryKey: beanKeys.userBeans(user?.id ?? ''),
      });
      options?.onSuccess?.();
    },
    onError: (error: Error) => {
      options?.onError?.(error);
    },
  });
};
