import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect, useState } from 'react';
import { Controller, useForm } from 'react-hook-form';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuthContext } from '@/contexts/AuthContext';

interface LoginFormData {
  email: string;
  password: string;
}

export default function LoginScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const { user, signInWithEmail } = useAuthContext();

  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
  } = useForm<LoginFormData>({
    mode: 'onChange',
    defaultValues: {
      email: '',
      password: '',
    },
  });

  // 로그인 성공 시 자동 리다이렉트
  useEffect(() => {
    if (user) {
      console.log('✅ 로그인 성공, 메인 화면으로 이동:', user.email);
      router.replace('/(tabs)');
      setLoading(false); // 리다이렉트 후 loading 해제
    }
  }, [user]);

  const onSubmit = async (data: LoginFormData) => {
    setLoading(true);
    try {
      const { error } = await signInWithEmail(data.email, data.password);

      if (error) {
        Alert.alert('오류', error.message);
        setLoading(false);
      } else {
        // 로그인 성공 - useEffect에서 자동으로 리다이렉트됨
        console.log('🔄 로그인 요청 성공, 상태 업데이트 대기 중...');
        // loading 상태는 useEffect에서 리다이렉트된 후에 해제됨
      }
    } catch (error) {
      Alert.alert('오류', '예상치 못한 오류가 발생했습니다.');
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Image
                resizeMode="contain"
                source={require('@/assets/images/logo.png')}
                style={styles.logoImage}
              />
            </View>
            <Text style={styles.title}>Coffimer</Text>
          </View>

          {/* 메인 카드 */}
          <View style={styles.card}>
            {/* 폼 */}
            <View style={styles.form}>
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
                    rules={{
                      required: '이메일을 입력해주세요',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: '올바른 이메일 형식을 입력해주세요',
                      },
                    }}
                  />
                </View>
                {errors.email && (
                  <Text style={styles.errorText}>{errors.email.message}</Text>
                )}
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
                    rules={{
                      required: '비밀번호를 입력해주세요',
                      minLength: {
                        value: 1,
                        message: '비밀번호를 입력해주세요',
                      },
                    }}
                  />
                  <TouchableOpacity
                    onPress={() => setShowPassword(!showPassword)}
                    style={styles.passwordToggle}
                  >
                    <Ionicons
                      color="#666"
                      name={showPassword ? 'eye-outline' : 'eye-off-outline'}
                      size={20}
                    />
                  </TouchableOpacity>
                </View>
                {errors.password && (
                  <Text style={styles.errorText}>
                    {errors.password.message}
                  </Text>
                )}
              </View>

              <View style={styles.loginButtonContainer}>
                <TouchableOpacity
                  disabled={loading || !isValid}
                  onPress={() => handleSubmit(onSubmit)()}
                  style={[
                    styles.primaryButton,
                    (loading || !isValid) && styles.disabledButton,
                  ]}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <Text style={styles.primaryButtonText}>로그인</Text>
                  )}
                </TouchableOpacity>
                <View style={styles.signUpContainer}>
                  <Text style={styles.signUpText}>아직 계정이 없으신가요?</Text>
                  <TouchableOpacity
                    activeOpacity={0.8}
                    onPress={() => router.push('/auth/signUp')}
                    style={styles.signUpButton}
                  >
                    <Ionicons
                      color="#8B4513"
                      name="person-add-outline"
                      size={18}
                      style={styles.signUpIcon}
                    />
                    <Text style={styles.signUpButtonText}>회원가입</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
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
  loginButtonContainer: { gap: 16 },
  signUpContainer: {
    alignItems: 'center',
    gap: 12,
  },
  signUpText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '400',
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'white',
    borderWidth: 2,
    borderColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    gap: 8,
    shadowColor: '#8B4513',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  signUpIcon: {
    marginRight: 4,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#8B4513',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
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
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 4,
    marginBottom: 24,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    borderRadius: 6,
  },
  activeTab: {
    backgroundColor: '#8B4513',
  },
  tabText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: 'white',
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
  primaryButton: {
    backgroundColor: '#8B4513',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: '#e0e0e0',
  },
  dividerText: {
    marginHorizontal: 16,
    fontSize: 14,
    color: '#666',
  },
  socialContainer: {
    gap: 12,
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  googleButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  appleButton: {
    backgroundColor: '#000',
  },
  socialButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  googleButtonText: {
    color: '#333',
  },
  appleButtonText: {
    color: 'white',
  },
  forgotPassword: {
    alignItems: 'center',
    marginTop: 24,
  },
  linkText: {
    fontSize: 14,
    color: '#8B4513',
    fontWeight: '500',
  },
});
