import {
  ErrorMessage,
  ReferralSourceBottomSheet,
  type BottomSheetRef,
} from '@/components/auth';
import {
  REFERRAL_OPTIONS,
  getReferralLabel,
} from '@/constants/referralOptions';
import { useAuthContext } from '@/contexts/AuthContext';
import {
  type SignUpFormData,
  signUpSchema,
} from '@/lib/validation/authSchema';
import { Ionicons } from '@expo/vector-icons';
import { zodResolver } from '@hookform/resolvers/zod';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import React, { useRef, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaView } from 'react-native-safe-area-context';

const TERMS_VERSION = '2026-02-23-v1';

export default function SignUpScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const referralSheetRef = useRef<BottomSheetRef>(null);
  const { signUpWithEmail } = useAuthContext();
  const {
    control,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isValid },
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: 'onTouched',
    defaultValues: {
      nickname: '',
      email: '',
      password: '',
      confirmPassword: '',
      referralSource: null,
      termsAgreed: false,
    },
  });

  const referralSource = watch('referralSource');

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    try {
      const { error } = await signUpWithEmail(
        data.email,
        data.password,
        data.nickname,
        data.referralSource,
        new Date().toISOString(),
        TERMS_VERSION
      );
      if (!error) {
        router.push('/auth/login');
      }
      if (error) {
        Alert.alert('오류', error.message);
      }
    } catch (error) {
      console.error('회원가입 오류:', error);
      Alert.alert('오류', '예상치 못한 오류가 발생했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const handleReferralSelect = (value: string | null) => {
    setValue('referralSource', value, { shouldValidate: true });
  };

  const referralDisplayText = referralSource
    ? getReferralLabel(REFERRAL_OPTIONS, referralSource)
    : null;

  return (
    <GestureHandlerRootView style={styles.flex}>
      <SafeAreaView style={styles.container}>
        <StatusBar style="dark" />
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardContainer}
        >
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            {/* 헤더 */}
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backButton}
              >
                <Ionicons color="#8B4513" name="chevron-back" size={24} />
              </TouchableOpacity>
              <View style={styles.logoContainer}>
                <Image
                  resizeMode="contain"
                  source={require('@/assets/images/logo.png')}
                  style={styles.logoImage}
                />
              </View>
              <Text style={styles.title}>회원가입</Text>
              <Text style={styles.subtitle}>
                Coffimer에 오신 것을 환영합니다
              </Text>
            </View>

            {/* 메인 카드 */}
            <View style={styles.card}>
              {/* 폼 */}
              <View style={styles.form}>
                <View>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.nickname && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      color={errors.nickname ? '#dc3545' : '#666'}
                      name="person-outline"
                      size={20}
                      style={styles.inputIcon}
                    />
                    <Controller
                      control={control}
                      name="nickname"
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          autoCapitalize="none"
                          maxLength={20}
                          onChangeText={onChange}
                          placeholder="닉네임"
                          placeholderTextColor="#999"
                          style={styles.input}
                          value={value}
                        />
                      )}
                    />
                  </View>
                  <ErrorMessage message={errors.nickname?.message || ''} />
                </View>

                <View>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.email && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      color={errors.email ? '#dc3545' : '#666'}
                      name="mail-outline"
                      size={20}
                      style={styles.inputIcon}
                    />
                    <Controller
                      control={control}
                      name="email"
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          autoCapitalize="none"
                          autoComplete="email"
                          keyboardType="email-address"
                          onChangeText={onChange}
                          placeholder="이메일"
                          placeholderTextColor="#999"
                          style={styles.input}
                          value={value}
                        />
                      )}
                    />
                  </View>
                  <ErrorMessage message={errors.email?.message || ''} />
                </View>

                <View>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.password && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      color={errors.password ? '#dc3545' : '#666'}
                      name="lock-closed-outline"
                      size={20}
                      style={styles.inputIcon}
                    />
                    <Controller
                      control={control}
                      name="password"
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          autoCapitalize="none"
                          onChangeText={onChange}
                          placeholder="비밀번호"
                          placeholderTextColor="#999"
                          secureTextEntry={!showPassword}
                          style={styles.input}
                          value={value}
                        />
                      )}
                    />
                    <TouchableOpacity
                      onPress={() => setShowPassword(!showPassword)}
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        color="#666"
                        name={
                          showPassword ? 'eye-outline' : 'eye-off-outline'
                        }
                        size={20}
                      />
                    </TouchableOpacity>
                  </View>
                  <ErrorMessage message={errors.password?.message || ''} />
                </View>

                <View>
                  <View
                    style={[
                      styles.inputContainer,
                      errors.confirmPassword && styles.inputError,
                    ]}
                  >
                    <Ionicons
                      color={errors.confirmPassword ? '#dc3545' : '#666'}
                      name="shield-checkmark-outline"
                      size={20}
                      style={styles.inputIcon}
                    />
                    <Controller
                      control={control}
                      name="confirmPassword"
                      render={({ field: { onChange, value } }) => (
                        <TextInput
                          autoCapitalize="none"
                          onChangeText={onChange}
                          placeholder="비밀번호 확인"
                          placeholderTextColor="#999"
                          secureTextEntry={!showConfirmPassword}
                          style={styles.input}
                          value={value}
                        />
                      )}
                    />
                    <TouchableOpacity
                      onPress={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      style={styles.passwordToggle}
                    >
                      <Ionicons
                        color="#666"
                        name={
                          showConfirmPassword
                            ? 'eye-outline'
                            : 'eye-off-outline'
                        }
                        size={20}
                      />
                    </TouchableOpacity>
                  </View>
                  <ErrorMessage
                    message={errors.confirmPassword?.message || ''}
                  />
                </View>

                {/* 유입 경로 선택 필드 */}
                <TouchableOpacity
                  onPress={() => {
                    Keyboard.dismiss();
                    referralSheetRef.current?.expand();
                  }}
                  style={styles.inputContainer}
                >
                  <Ionicons
                    color="#666"
                    name="megaphone-outline"
                    size={20}
                    style={styles.inputIcon}
                  />
                  <Text
                    style={
                      referralDisplayText
                        ? styles.selectedText
                        : styles.placeholderText
                    }
                  >
                    {referralDisplayText || '어디서 알고 오셨나요? (선택)'}
                  </Text>
                  <Ionicons color="#999" name="chevron-down" size={20} />
                </TouchableOpacity>

                {/* 약관 동의 체크박스 */}
                <Controller
                  control={control}
                  name="termsAgreed"
                  render={({ field: { onChange, value }, fieldState: { error } }) => (
                    <View style={styles.termsCheckboxContainer}>
                      <View style={styles.checkboxRow}>
                        <Pressable
                          accessibilityLabel="서비스 이용약관 및 개인정보 처리방침 동의"
                          accessibilityRole="checkbox"
                          accessibilityState={{ checked: value }}
                          hitSlop={{ top: 4, bottom: 4, left: 4, right: 4 }}
                          onPress={() => onChange(!value)}
                          style={styles.checkboxTouchArea}
                        >
                          <Ionicons
                            color={value ? '#8B4513' : error ? '#dc3545' : '#999'}
                            name={value ? 'checkbox' : 'square-outline'}
                            size={22}
                          />
                        </Pressable>
                        <Text style={styles.termsCheckboxText}>
                          <Text
                            accessibilityRole="link"
                            onPress={() => WebBrowser.openBrowserAsync('https://coffimer.com/terms')}
                            style={styles.termsLinkText}
                          >
                            이용약관
                          </Text>
                          <Text onPress={() => onChange(!value)}>
                            {' 및 '}
                          </Text>
                          <Text
                            accessibilityRole="link"
                            onPress={() => WebBrowser.openBrowserAsync('https://coffimer.com/privacy')}
                            style={styles.termsLinkText}
                          >
                            개인정보 수집·이용
                          </Text>
                          <Text onPress={() => onChange(!value)}>
                            에 동의합니다
                          </Text>
                        </Text>
                      </View>
                      <ErrorMessage message={error?.message ?? ''} />
                    </View>
                  )}
                />

                <View style={styles.signUpButtonContainer}>
                  <TouchableOpacity
                    onPress={handleSubmit(onSubmit)}
                    style={[
                      styles.primaryButton,
                      (loading || !isValid) && styles.disabledButton,
                    ]}
                  >
                    {loading ? (
                      <ActivityIndicator color="white" />
                    ) : (
                      <>
                        <Ionicons
                          color="white"
                          name="person-add"
                          size={18}
                          style={styles.buttonIcon}
                        />
                        <Text style={styles.primaryButtonText}>
                          계정 만들기
                        </Text>
                      </>
                    )}
                  </TouchableOpacity>

                  <View style={styles.loginContainer}>
                    <Text style={styles.loginText}>
                      이미 계정이 있으신가요?
                    </Text>
                    <TouchableOpacity
                      activeOpacity={0.8}
                      onPress={() => router.back()}
                      style={styles.loginButton}
                    >
                      <Text style={styles.loginButtonText}>로그인</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            </View>

          </ScrollView>
        </KeyboardAvoidingView>

        {/* 바텀 시트 - ScrollView 외부 렌더링 */}
        <ReferralSourceBottomSheet
          onSelect={handleReferralSelect}
          ref={referralSheetRef}
          selectedValue={referralSource}
        />
      </SafeAreaView>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: 'center',
  },
  signUpButtonContainer: {
    gap: 16,
  },
  loginContainer: {
    alignItems: 'center',
    gap: 12,
  },
  loginText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
    textDecorationLine: 'underline',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    position: 'relative',
  },
  backButton: {
    position: 'absolute',
    left: 0,
    top: 8,
    padding: 8,
    zIndex: 1,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: '#fff',
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  logoImage: {
    width: 80,
    height: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#8B4513',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 8,
    marginBottom: 20,
  },
  form: {
    marginBottom: 24,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f8f8f8',
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  inputError: {
    borderColor: '#dc3545',
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    color: '#dc3545',
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '400',
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  passwordToggle: {
    padding: 4,
  },
  selectedText: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#333',
  },
  placeholderText: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: '#999',
  },
  primaryButton: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 4,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  termsCheckboxContainer: {
    marginBottom: 8,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  checkboxTouchArea: {
    minWidth: 44,
    minHeight: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  termsCheckboxText: {
    flex: 1,
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    paddingTop: 12,
  },
  termsLinkText: {
    color: '#8B4513',
    fontWeight: '500',
    textDecorationLine: 'underline',
  },
});
