import {
  signUpSchema,
  signInSchema,
  changePasswordSchema,
  resetPasswordRequestSchema,
  resetPasswordSchema,
  NICKNAME_RULES,
} from '@/lib/validation/authSchema';

describe('Auth Validation Schemas', () => {
  describe('signUpSchema', () => {
    describe('닉네임 유효성 검사', () => {
      it('2자 미만의 닉네임을 거부한다', () => {
        const result = signUpSchema.safeParse({
          nickname: 'a',
          email: 'test@example.com',
          password: 'abc123',
          confirmPassword: 'abc123',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('닉네임은 2자 이상이어야 합니다');
        }
      });

      it('20자를 초과하는 닉네임을 거부한다', () => {
        const result = signUpSchema.safeParse({
          nickname: 'a'.repeat(21),
          email: 'test@example.com',
          password: 'abc123',
          confirmPassword: 'abc123',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('닉네임은 20자 이하여야 합니다');
        }
      });

      it('유효한 닉네임을 수락한다', () => {
        const result = signUpSchema.safeParse({
          nickname: '유효한닉네임',
          email: 'test@example.com',
          password: 'abc123',
          confirmPassword: 'abc123',
        });

        expect(result.success).toBe(true);
      });

      it('정확한 닉네임 규칙 상수를 사용한다', () => {
        expect(NICKNAME_RULES.MIN_LENGTH).toBe(2);
        expect(NICKNAME_RULES.MAX_LENGTH).toBe(20);
      });
    });

    describe('이메일 유효성 검사', () => {
      it('빈 이메일을 거부한다', () => {
        const result = signUpSchema.safeParse({
          nickname: '테스트',
          email: '',
          password: 'abc123',
          confirmPassword: 'abc123',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('이메일을 입력해주세요');
        }
      });

      it('잘못된 이메일 형식을 거부한다', () => {
        const invalidEmails = [
          'notanemail',
          '@example.com',
          'test@',
          'test@.com',
          'test..@example.com',
        ];

        invalidEmails.forEach(email => {
          const result = signUpSchema.safeParse({
            nickname: '테스트',
            email,
            password: 'abc123',
            confirmPassword: 'abc123',
          });

          expect(result.success).toBe(false);
          if (!result.success) {
            expect(result.error.issues.some(issue => 
              issue.message === '올바른 이메일 형식을 입력해주세요'
            )).toBe(true);
          }
        });
      });

      it('유효한 이메일 형식을 수락한다', () => {
        const validEmails = [
          'test@example.com',
          'user.name@example.co.kr',
          'test+tag@example.com',
          'test123@test-domain.com',
        ];

        validEmails.forEach(email => {
          const result = signUpSchema.safeParse({
            nickname: '테스트',
            email,
            password: 'abc123',
            confirmPassword: 'abc123',
          });

          expect(result.success).toBe(true);
        });
      });
    });

    describe('비밀번호 유효성 검사', () => {
      it('6자 미만의 비밀번호를 거부한다', () => {
        const result = signUpSchema.safeParse({
          nickname: '테스트',
          email: 'test@example.com',
          password: 'ab12',
          confirmPassword: 'ab12',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('비밀번호는 6자 이상이어야 합니다');
        }
      });

      it('영문자가 없는 비밀번호를 거부한다', () => {
        const result = signUpSchema.safeParse({
          nickname: '테스트',
          email: 'test@example.com',
          password: '123456',
          confirmPassword: '123456',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('영문자를 포함해야 합니다');
        }
      });

      it('숫자가 없는 비밀번호를 거부한다', () => {
        const result = signUpSchema.safeParse({
          nickname: '테스트',
          email: 'test@example.com',
          password: 'abcdef',
          confirmPassword: 'abcdef',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('숫자를 포함해야 합니다');
        }
      });

      it('유효한 비밀번호를 수락한다', () => {
        const validPasswords = [
          'abc123',
          'Password1',
          'test1234',
          'MyPass99',
        ];

        validPasswords.forEach(password => {
          const result = signUpSchema.safeParse({
            nickname: '테스트',
            email: 'test@example.com',
            password,
            confirmPassword: password,
          });

          expect(result.success).toBe(true);
        });
      });

      it('특수문자가 포함된 비밀번호도 수락한다', () => {
        const result = signUpSchema.safeParse({
          nickname: '테스트',
          email: 'test@example.com',
          password: 'abc123!@#',
          confirmPassword: 'abc123!@#',
        });

        expect(result.success).toBe(true);
      });
    });

    describe('비밀번호 확인 유효성 검사', () => {
      it('빈 비밀번호 확인을 거부한다', () => {
        const result = signUpSchema.safeParse({
          nickname: '테스트',
          email: 'test@example.com',
          password: 'abc123',
          confirmPassword: '',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('비밀번호 확인을 입력해주세요');
        }
      });

      it('일치하지 않는 비밀번호를 거부한다', () => {
        const result = signUpSchema.safeParse({
          nickname: '테스트',
          email: 'test@example.com',
          password: 'abc123',
          confirmPassword: 'abc124',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          expect(result.error.issues[0].message).toBe('비밀번호가 일치하지 않습니다');
        }
      });

      it('일치하는 비밀번호를 수락한다', () => {
        const result = signUpSchema.safeParse({
          nickname: '테스트',
          email: 'test@example.com',
          password: 'abc123',
          confirmPassword: 'abc123',
        });

        expect(result.success).toBe(true);
      });
    });

    describe('전체 폼 유효성 검사', () => {
      it('모든 필드가 유효할 때 성공한다', () => {
        const result = signUpSchema.safeParse({
          nickname: '테스트유저',
          email: 'test@example.com',
          password: 'secure123',
          confirmPassword: 'secure123',
        });

        expect(result.success).toBe(true);
        if (result.success) {
          expect(result.data).toEqual({
            nickname: '테스트유저',
            email: 'test@example.com',
            password: 'secure123',
            confirmPassword: 'secure123',
          });
        }
      });

      it('여러 필드에 오류가 있을 때 모든 오류를 반환한다', () => {
        const result = signUpSchema.safeParse({
          nickname: 'a',
          email: 'invalid',
          password: '123',
          confirmPassword: '456',
        });

        expect(result.success).toBe(false);
        if (!result.success) {
          const messages = result.error.issues.map(issue => issue.message);
          expect(messages).toContain('닉네임은 2자 이상이어야 합니다');
          expect(messages).toContain('올바른 이메일 형식을 입력해주세요');
          expect(messages).toContain('비밀번호는 6자 이상이어야 합니다');
        }
      });
    });
  });

  describe('signInSchema', () => {
    it('유효한 로그인 정보를 수락한다', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: 'anypassword',
      });

      expect(result.success).toBe(true);
    });

    it('빈 이메일을 거부한다', () => {
      const result = signInSchema.safeParse({
        email: '',
        password: 'password',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('이메일을 입력해주세요');
      }
    });

    it('빈 비밀번호를 거부한다', () => {
      const result = signInSchema.safeParse({
        email: 'test@example.com',
        password: '',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('비밀번호를 입력해주세요');
      }
    });
  });

  describe('changePasswordSchema', () => {
    it('유효한 비밀번호 변경 정보를 수락한다', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmNewPassword: 'newpass123',
      });

      expect(result.success).toBe(true);
    });

    it('새 비밀번호가 일치하지 않을 때 거부한다', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass123',
        newPassword: 'newpass123',
        confirmNewPassword: 'different123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('새 비밀번호가 일치하지 않습니다');
      }
    });

    it('새 비밀번호가 규칙을 만족하지 않을 때 거부한다', () => {
      const result = changePasswordSchema.safeParse({
        currentPassword: 'oldpass123',
        newPassword: '123',
        confirmNewPassword: '123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('비밀번호는 6자 이상이어야 합니다');
      }
    });
  });

  describe('resetPasswordRequestSchema', () => {
    it('유효한 이메일을 수락한다', () => {
      const result = resetPasswordRequestSchema.safeParse({
        email: 'test@example.com',
      });

      expect(result.success).toBe(true);
    });

    it('잘못된 이메일 형식을 거부한다', () => {
      const result = resetPasswordRequestSchema.safeParse({
        email: 'not-an-email',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('올바른 이메일 형식을 입력해주세요');
      }
    });
  });

  describe('resetPasswordSchema', () => {
    it('유효한 비밀번호 재설정 정보를 수락한다', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'newpass123',
        confirmPassword: 'newpass123',
      });

      expect(result.success).toBe(true);
    });

    it('비밀번호가 일치하지 않을 때 거부한다', () => {
      const result = resetPasswordSchema.safeParse({
        password: 'newpass123',
        confirmPassword: 'different123',
      });

      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.issues[0].message).toBe('비밀번호가 일치하지 않습니다');
      }
    });
  });
});