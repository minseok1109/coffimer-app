import { z } from 'zod';

// 비밀번호 규칙 상수
const PASSWORD_RULES = {
  MIN_LENGTH: 6,
  REGEX: {
    LETTER: /[A-Za-z]/,
    NUMBER: /\d/,
    SPECIAL: /[@$!%*#?&]/,
  },
} as const;

// 닉네임 규칙 상수
export const NICKNAME_RULES = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 20,
} as const;

// 비밀번호 유효성 검사를 위한 커스텀 스키마
const passwordSchema = z
  .string()
  .min(PASSWORD_RULES.MIN_LENGTH, '비밀번호는 6자 이상이어야 합니다')
  .refine((val) => PASSWORD_RULES.REGEX.LETTER.test(val), {
    message: '영문자를 포함해야 합니다',
  })
  .refine((val) => PASSWORD_RULES.REGEX.NUMBER.test(val), {
    message: '숫자를 포함해야 합니다',
  })
  .transform((val) => {
    // Transform을 통해 추가 메타데이터 제공 (실제 값은 변경하지 않음)
    return val;
  });

// 회원가입 스키마
export const signUpSchema = z
  .object({
    nickname: z
      .string()
      .min(NICKNAME_RULES.MIN_LENGTH, '닉네임은 2자 이상이어야 합니다')
      .max(NICKNAME_RULES.MAX_LENGTH, '닉네임은 20자 이하여야 합니다'),
    email: z
      .string()
      .min(1, '이메일을 입력해주세요')
      .email('올바른 이메일 형식을 입력해주세요'),
    password: passwordSchema,
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

// 로그인 스키마
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식을 입력해주세요'),
  password: z.string().min(1, '비밀번호를 입력해주세요'),
});

// 비밀번호 변경 스키마
export const changePasswordSchema = z
  .object({
    currentPassword: z.string().min(1, '현재 비밀번호를 입력해주세요'),
    newPassword: passwordSchema,
    confirmNewPassword: z.string().min(1, '새 비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.newPassword === data.confirmNewPassword, {
    message: '새 비밀번호가 일치하지 않습니다',
    path: ['confirmNewPassword'],
  });

// 비밀번호 재설정 요청 스키마
export const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .min(1, '이메일을 입력해주세요')
    .email('올바른 이메일 형식을 입력해주세요'),
});

// 비밀번호 재설정 스키마
export const resetPasswordSchema = z
  .object({
    password: passwordSchema,
    confirmPassword: z.string().min(1, '비밀번호 확인을 입력해주세요'),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '비밀번호가 일치하지 않습니다',
    path: ['confirmPassword'],
  });

// TypeScript 타입 추출
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ResetPasswordRequestFormData = z.infer<
  typeof resetPasswordRequestSchema
>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// 기본값 함수들
export const getDefaultSignUpForm = (): SignUpFormData => ({
  nickname: '',
  email: '',
  password: '',
  confirmPassword: '',
});

export const getDefaultSignInForm = (): SignInFormData => ({
  email: '',
  password: '',
});

export const getDefaultChangePasswordForm = (): ChangePasswordFormData => ({
  currentPassword: '',
  newPassword: '',
  confirmNewPassword: '',
});

