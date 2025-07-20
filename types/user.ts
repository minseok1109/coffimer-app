import { TablesInsert, Tables, TablesUpdate } from "./database";

export type User = Tables<"users">;

export type UserInsert = TablesInsert<"users">;
export type UserUpdate = TablesUpdate<"users">;

/**
 * 사용자 관련 추가 타입 정의
 */

// 사용자 기본 정보 (자주 사용되는 필드만)
export type UserBasicInfo = Pick<
  User,
  "id" | "email" | "display_name" | "profile_image"
>;

// 사용자 공개 정보 (다른 사용자에게 보여줄 정보)
export type UserPublicInfo = Pick<
  User,
  "id" | "display_name" | "profile_image"
>;

// 사용자 검색 결과 타입
export type UserSearchResult = Pick<
  User,
  "id" | "email" | "display_name" | "profile_image"
>;

// 사용자 프로필 업데이트용 타입 (email과 id는 제외)
export type UserProfileUpdate = Omit<UserUpdate, "id" | "email" | "created_at">;

// 사용자 생성 시 필수 정보
export type UserCreateRequired = Pick<
  UserInsert,
  "id" | "email" | "display_name"
>;

// API 응답 타입들
export interface UserServiceResponse<T> {
  data: T | null;
  error: any;
}

export interface UserListResponse {
  data: User[] | null;
  error: any;
}

export interface UserExistsResponse {
  exists: boolean;
  error: any;
}

// Hook 상태 타입들
export interface UseUserState {
  user: User | null;
  loading: boolean;
  error: any;
  refetch: () => void;
}

export interface UseUserBasicState {
  userInfo: UserBasicInfo | null;
  loading: boolean;
  error: any;
  refetch: () => void;
}

export interface UseUpdateUserState {
  updateUser: (
    updates: UserProfileUpdate
  ) => Promise<{ success: boolean; data: User | null }>;
  loading: boolean;
  error: any;
}

export interface UseUserSearchState {
  users: User[];
  loading: boolean;
  error: any;
  searchUsers: (searchTerm: string, limit?: number) => Promise<void>;
  clearSearch: () => void;
}

// 유틸리티 타입들
export type UserField = keyof User;
export type RequiredUserFields = keyof UserCreateRequired;
export type OptionalUserFields = Exclude<UserField, RequiredUserFields>;

// 사용자 상태 enum
export enum UserStatus {
  LOADING = "loading",
  AUTHENTICATED = "authenticated",
  UNAUTHENTICATED = "unauthenticated",
  ERROR = "error",
}

// 사용자 관련 상수
export const USER_CONSTANTS = {
  DISPLAY_NAME_MAX_LENGTH: 50,
  DISPLAY_NAME_MIN_LENGTH: 1,
  SEARCH_RESULTS_DEFAULT_LIMIT: 10,
  SEARCH_RESULTS_MAX_LIMIT: 50,
} as const;

// 사용자 검증 함수들의 반환 타입
export interface UserValidationResult {
  isValid: boolean;
  errors: string[];
}

// 사용자 필터 옵션
export interface UserFilterOptions {
  searchTerm?: string;
  limit?: number;
  offset?: number;
  sortBy?: "created_at" | "updated_at" | "display_name" | "email";
  sortOrder?: "asc" | "desc";
}

// 사용자 통계 타입 (확장 가능)
export interface UserStats {
  totalRecipes?: number;
  totalLikes?: number;
  totalSavedRecipes?: number;
  joinedAt: string;
}

// 확장된 사용자 정보 (다른 테이블과 조인된 데이터 포함)
export interface UserWithStats extends User {
  stats?: UserStats;
}

// 프로필 이미지 업로드 관련
export interface ProfileImageUpload {
  file: File | Blob;
  fileName: string;
  mimeType: string;
}

export interface ProfileImageUploadResult {
  success: boolean;
  imageUrl?: string;
  error?: string;
}
