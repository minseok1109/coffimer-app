import { supabase } from '@/lib/supabaseClient';
import type {
  User,
  UserBasicInfo,
  UserExistsResponse,
  UserInsert,
  UserListResponse,
  UserServiceResponse,
  UserUpdate,
} from '@/types/user';

/**
 * 사용자 관련 API 서비스
 */
export class UserService {
  /**
   * 현재 로그인한 사용자의 프로필 정보 조회
   * @returns 사용자 정보 (email, display_name 포함)
   */
  static async getCurrentUserProfile(): Promise<UserServiceResponse<User>> {
    try {
      // 현재 인증된 사용자 가져오기
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          data: null,
          error: authError || new Error('인증되지 않은 사용자입니다.'),
        };
      }

      // 사용자 프로필 정보 조회
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', user.id)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * 특정 사용자 ID로 프로필 정보 조회
   * @param userId 사용자 ID
   * @returns 사용자 정보
   */
  static async getUserProfileById(
    userId: string
  ): Promise<UserServiceResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('id', userId)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * 이메일로 사용자 검색
   * @param email 이메일 주소
   * @returns 사용자 정보
   */
  static async getUserByEmail(
    email: string
  ): Promise<UserServiceResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('*')
        .eq('email', email)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * 사용자 프로필 업데이트
   * @param updates 업데이트할 사용자 정보
   * @returns 업데이트된 사용자 정보
   */
  static async updateUserProfile(
    updates: UserUpdate
  ): Promise<UserServiceResponse<User>> {
    try {
      // 현재 인증된 사용자 가져오기
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          data: null,
          error: authError || new Error('인증되지 않은 사용자입니다.'),
        };
      }

      const { data, error } = await supabase
        .from('users')
        .update({
          ...updates,
          updated_at: new Date().toISOString(),
        })
        .eq('id', user.id)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * 새 사용자 프로필 생성 (회원가입 시 사용)
   * @param userProfile 새 사용자 정보
   * @returns 생성된 사용자 정보
   */
  static async createUserProfile(
    userProfile: UserInsert
  ): Promise<UserServiceResponse<User>> {
    try {
      const { data, error } = await supabase
        .from('users')
        .insert(userProfile)
        .select()
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * 사용자 목록 조회 (검색 기능 포함)
   * @param searchTerm 검색어 (display_name 또는 email로 검색)
   * @param limit 결과 개수 제한
   * @returns 사용자 목록
   */
  static async searchUsers(
    searchTerm?: string,
    limit = 10
  ): Promise<UserListResponse> {
    try {
      let query = supabase.from('users').select('*').limit(limit);

      if (searchTerm) {
        query = query.or(
          `display_name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`
        );
      }

      const { data, error } = await query;

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * 현재 사용자의 간단한 정보만 조회 (email, display_name만)
   * @returns 사용자의 email과 display_name
   */
  static async getCurrentUserBasicInfo(): Promise<
    UserServiceResponse<UserBasicInfo>
  > {
    try {
      // 현재 인증된 사용자 가져오기
      const {
        data: { user },
        error: authError,
      } = await supabase.auth.getUser();

      if (authError || !user) {
        return {
          data: null,
          error: authError || new Error('인증되지 않은 사용자입니다.'),
        };
      }

      // 필요한 필드만 선택해서 조회
      const { data, error } = await supabase
        .from('users')
        .select('id, email, display_name, profile_image')
        .eq('id', user.id)
        .single();

      return { data, error };
    } catch (error) {
      return { data: null, error };
    }
  }

  /**
   * 프로필 이미지 업데이트
   * @param imageUrl 새 프로필 이미지 URL
   * @returns 업데이트 결과
   */
  static async updateProfileImage(
    imageUrl: string
  ): Promise<UserServiceResponse<User>> {
    return UserService.updateUserProfile({ profile_image: imageUrl });
  }

  /**
   * 사용자 존재 여부 확인
   * @param userId 사용자 ID
   * @returns 존재 여부
   */
  static async checkUserExists(userId: string): Promise<UserExistsResponse> {
    try {
      const { data, error } = await supabase
        .from('users')
        .select('id')
        .eq('id', userId)
        .single();

      return { exists: !!data, error };
    } catch (error) {
      return { exists: false, error };
    }
  }
}
