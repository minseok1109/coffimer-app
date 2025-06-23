import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { UserService } from '@/services/userService';
import {
  User,
  UserBasicInfo,
  UserUpdate,
  UserInsert,
} from '@/types/user';

// Query Keys
export const userQueryKeys = {
  all: ['users'] as const,
  currentUser: () => [...userQueryKeys.all, 'current'] as const,
  currentUserBasic: () => [...userQueryKeys.all, 'current', 'basic'] as const,
  userById: (id: string) => [...userQueryKeys.all, 'by-id', id] as const,
  userByEmail: (email: string) => [...userQueryKeys.all, 'by-email', email] as const,
  searchUsers: (searchTerm?: string, limit?: number) => 
    [...userQueryKeys.all, 'search', { searchTerm, limit }] as const,
  userExists: (id: string) => [...userQueryKeys.all, 'exists', id] as const,
};

// Query Hooks
export const useCurrentUserProfile = () => {
  return useQuery({
    queryKey: userQueryKeys.currentUser(),
    queryFn: async () => {
      const response = await UserService.getCurrentUserProfile();
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useCurrentUserBasicInfo = () => {
  return useQuery({
    queryKey: userQueryKeys.currentUserBasic(),
    queryFn: async () => {
      const response = await UserService.getCurrentUserBasicInfo();
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserProfileById = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: userQueryKeys.userById(userId),
    queryFn: async () => {
      const response = await UserService.getUserProfileById(userId);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    enabled: enabled && !!userId,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useUserByEmail = (email: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: userQueryKeys.userByEmail(email),
    queryFn: async () => {
      const response = await UserService.getUserByEmail(email);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    enabled: enabled && !!email,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};

export const useSearchUsers = (searchTerm?: string, limit: number = 10) => {
  return useQuery({
    queryKey: userQueryKeys.searchUsers(searchTerm, limit),
    queryFn: async () => {
      const response = await UserService.searchUsers(searchTerm, limit);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
};

export const useUserExists = (userId: string, enabled: boolean = true) => {
  return useQuery({
    queryKey: userQueryKeys.userExists(userId),
    queryFn: async () => {
      const response = await UserService.checkUserExists(userId);
      if (response.error) {
        throw response.error;
      }
      return response.exists;
    },
    enabled: enabled && !!userId,
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
};

// Mutation Hooks
export const useUpdateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (updates: UserUpdate) => {
      const response = await UserService.updateUserProfile(updates);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: userQueryKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.currentUserBasic() });
      
      // Update cache with new data
      if (data) {
        queryClient.setQueryData(userQueryKeys.currentUser(), data);
        queryClient.setQueryData(userQueryKeys.userById(data.id), data);
      }
    },
  });
};

export const useCreateUserProfile = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (userProfile: UserInsert) => {
      const response = await UserService.createUserProfile(userProfile);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate user queries
      queryClient.invalidateQueries({ queryKey: userQueryKeys.all });
      
      // Set cache for new user
      if (data) {
        queryClient.setQueryData(userQueryKeys.userById(data.id), data);
      }
    },
  });
};

export const useUpdateProfileImage = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (imageUrl: string) => {
      const response = await UserService.updateProfileImage(imageUrl);
      if (response.error) {
        throw response.error;
      }
      return response.data;
    },
    onSuccess: (data) => {
      // Invalidate and refetch user queries
      queryClient.invalidateQueries({ queryKey: userQueryKeys.currentUser() });
      queryClient.invalidateQueries({ queryKey: userQueryKeys.currentUserBasic() });
      
      // Update cache with new data
      if (data) {
        queryClient.setQueryData(userQueryKeys.currentUser(), data);
        queryClient.setQueryData(userQueryKeys.userById(data.id), data);
      }
    },
  });
};