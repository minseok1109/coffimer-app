import { z } from "zod";

// 비밀번호 규칙 상수
export const PASSWORD_RULES = {
  MIN_LENGTH: 6,
  REGEX: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/,
  DESCRIPTION: [
    "6자 이상 입력해주세요",
    "영문자와 숫자를 포함해주세요",
    "특수문자(@$!%*#?&) 사용 가능합니다"
  ]
} as const;

// 닉네임 규칙 상수
export const NICKNAME_RULES = {
  MIN_LENGTH: 2,
  MAX_LENGTH: 20,
} as const;

// 회원가입 스키마
export const signUpSchema = z.object({
  nickname: z
    .string()
    .min(NICKNAME_RULES.MIN_LENGTH, "닉네임은 2자 이상이어야 합니다")
    .max(NICKNAME_RULES.MAX_LENGTH, "닉네임은 20자 이하여야 합니다"),
  email: z
    .string()
    .min(1, "이메일을 입력해주세요")
    .email("올바른 이메일 형식을 입력해주세요"),
  password: z
    .string()
    .min(PASSWORD_RULES.MIN_LENGTH, "비밀번호는 6자 이상이어야 합니다")
    .regex(PASSWORD_RULES.REGEX, "비밀번호는 영문자와 숫자를 포함해야 합니다"),
  confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

// 로그인 스키마
export const signInSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요")
    .email("올바른 이메일 형식을 입력해주세요"),
  password: z.string().min(1, "비밀번호를 입력해주세요"),
});

// 비밀번호 변경 스키마
export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "현재 비밀번호를 입력해주세요"),
  newPassword: z
    .string()
    .min(PASSWORD_RULES.MIN_LENGTH, "새 비밀번호는 6자 이상이어야 합니다")
    .regex(PASSWORD_RULES.REGEX, "새 비밀번호는 영문자와 숫자를 포함해야 합니다"),
  confirmNewPassword: z.string().min(1, "새 비밀번호 확인을 입력해주세요"),
}).refine((data) => data.newPassword === data.confirmNewPassword, {
  message: "새 비밀번호가 일치하지 않습니다",
  path: ["confirmNewPassword"],
});

// 비밀번호 재설정 요청 스키마
export const resetPasswordRequestSchema = z.object({
  email: z
    .string()
    .min(1, "이메일을 입력해주세요")
    .email("올바른 이메일 형식을 입력해주세요"),
});

// 비밀번호 재설정 스키마
export const resetPasswordSchema = z.object({
  password: z
    .string()
    .min(PASSWORD_RULES.MIN_LENGTH, "비밀번호는 6자 이상이어야 합니다")
    .regex(PASSWORD_RULES.REGEX, "비밀번호는 영문자와 숫자를 포함해야 합니다"),
  confirmPassword: z.string().min(1, "비밀번호 확인을 입력해주세요"),
}).refine((data) => data.password === data.confirmPassword, {
  message: "비밀번호가 일치하지 않습니다",
  path: ["confirmPassword"],
});

// TypeScript 타입 추출
export type SignUpFormData = z.infer<typeof signUpSchema>;
export type SignInFormData = z.infer<typeof signInSchema>;
export type ChangePasswordFormData = z.infer<typeof changePasswordSchema>;
export type ResetPasswordRequestFormData = z.infer<typeof resetPasswordRequestSchema>;
export type ResetPasswordFormData = z.infer<typeof resetPasswordSchema>;

// 기본값 함수들
export const getDefaultSignUpForm = (): SignUpFormData => ({
  nickname: "",
  email: "",
  password: "",
  confirmPassword: "",
});

export const getDefaultSignInForm = (): SignInFormData => ({
  email: "",
  password: "",
});

export const getDefaultChangePasswordForm = (): ChangePasswordFormData => ({
  currentPassword: "",
  newPassword: "",
  confirmNewPassword: "",
});

// 비밀번호 강도 체크 유틸리티
export const checkPasswordStrength = (password: string) => {
  const checks = {
    length: password.length >= PASSWORD_RULES.MIN_LENGTH,
    hasLetter: /[A-Za-z]/.test(password),
    hasNumber: /\d/.test(password),
    hasSpecialChar: /[@$!%*#?&]/.test(password),
  };

  const strength = Object.values(checks).filter(Boolean).length;
  
  return {
    ...checks,
    strength,
    isValid: checks.length && checks.hasLetter && checks.hasNumber,
    level: strength <= 1 ? 'weak' : strength <= 2 ? 'medium' : strength <= 3 ? 'strong' : 'very-strong'
  } as const;
};