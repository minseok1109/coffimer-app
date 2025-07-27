import { ErrorMessage, PasswordRulesGuide } from "@/components/auth";
import { useAuthContext } from "@/contexts/AuthContext";
import { signUpSchema, type SignUpFormData } from "@/lib/validation/authSchema";
import { Ionicons } from "@expo/vector-icons";
import { zodResolver } from "@hookform/resolvers/zod";
import { router } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import { Controller, useForm } from "react-hook-form";
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
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function SignUpScreen() {
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const { signUpWithEmail } = useAuthContext();
  const {
    control,
    handleSubmit,
    formState: { errors, isValid },
    watch,
  } = useForm<SignUpFormData>({
    resolver: zodResolver(signUpSchema),
    mode: "onChange",
    defaultValues: {
      nickname: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  const watchPassword = watch("password");

  const onSubmit = async (data: SignUpFormData) => {
    setLoading(true);
    try {
      const { error } = await signUpWithEmail(data.email, data.password);
      if (!error) {
        router.push("/auth/login");
      }
      if (error) {
        Alert.alert("오류", error.message);
      }
    } catch (error) {
      console.error("회원가입 오류:", error);
      Alert.alert("오류", "예상치 못한 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="dark" />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.keyboardContainer}
      >
        <ScrollView contentContainerStyle={styles.scrollContainer}>
          {/* 헤더 */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => router.back()}
            >
              <Ionicons name="chevron-back" size={24} color="#8B4513" />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image
                source={require("@/assets/images/logo.png")}
                style={styles.logoImage}
                resizeMode="contain"
              />
            </View>
            <Text style={styles.title}>회원가입</Text>
            <Text style={styles.subtitle}>Coffimer에 오신 것을 환영합니다</Text>
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
                    name="person-outline"
                    size={20}
                    color={errors.nickname ? "#dc3545" : "#666"}
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    name="nickname"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="닉네임"
                        value={value}
                        onChangeText={onChange}
                        autoCapitalize="none"
                        maxLength={20}
                        placeholderTextColor="#999"
                      />
                    )}
                  />
                </View>
                <ErrorMessage message={errors.nickname?.message || ""} />
              </View>

              <View>
                <View
                  style={[
                    styles.inputContainer,
                    errors.email && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="mail-outline"
                    size={20}
                    color={errors.email ? "#dc3545" : "#666"}
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    name="email"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="이메일"
                        placeholderTextColor="#999"
                        value={value}
                        onChangeText={onChange}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoComplete="email"
                      />
                    )}
                  />
                </View>
                <ErrorMessage message={errors.email?.message || ""} />
              </View>

              <View>
                <View
                  style={[
                    styles.inputContainer,
                    errors.password && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="lock-closed-outline"
                    size={20}
                    color={errors.password ? "#dc3545" : "#666"}
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    name="password"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="비밀번호"
                        placeholderTextColor="#999"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showPassword}
                        autoCapitalize="none"
                      />
                    )}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowPassword(!showPassword)}
                  >
                    <Ionicons
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                <ErrorMessage message={errors.password?.message || ""} />
              </View>

              <View>
                <View
                  style={[
                    styles.inputContainer,
                    errors.confirmPassword && styles.inputError,
                  ]}
                >
                  <Ionicons
                    name="shield-checkmark-outline"
                    size={20}
                    color={errors.confirmPassword ? "#dc3545" : "#666"}
                    style={styles.inputIcon}
                  />
                  <Controller
                    control={control}
                    name="confirmPassword"
                    render={({ field: { onChange, value } }) => (
                      <TextInput
                        style={styles.input}
                        placeholder="비밀번호 확인"
                        placeholderTextColor="#999"
                        value={value}
                        onChangeText={onChange}
                        secureTextEntry={!showConfirmPassword}
                        autoCapitalize="none"
                      />
                    )}
                  />
                  <TouchableOpacity
                    style={styles.passwordToggle}
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                  >
                    <Ionicons
                      name={
                        showConfirmPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={20}
                      color="#666"
                    />
                  </TouchableOpacity>
                </View>
                <ErrorMessage message={errors.confirmPassword?.message || ""} />
              </View>
              <PasswordRulesGuide password={watchPassword} />

              <View style={styles.signUpButtonContainer}>
                <TouchableOpacity
                  style={[
                    styles.primaryButton,
                    (loading || !isValid) && styles.disabledButton,
                  ]}
                  onPress={handleSubmit(onSubmit)}
                  disabled={loading || !isValid}
                >
                  {loading ? (
                    <ActivityIndicator color="white" />
                  ) : (
                    <>
                      <Ionicons
                        name="person-add"
                        size={18}
                        color="white"
                        style={styles.buttonIcon}
                      />
                      <Text style={styles.primaryButtonText}>계정 만들기</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
                  <TouchableOpacity
                    style={styles.loginButton}
                    onPress={() => router.back()}
                    activeOpacity={0.8}
                  >
                    <Text style={styles.loginButtonText}>로그인</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>

          {/* 약관 동의 */}
          <View style={styles.termsContainer}>
            <Text style={styles.termsText}>
              계정을 만들면 <Text style={styles.linkText}>서비스 이용약관</Text>
              과 <Text style={styles.linkText}>개인정보 보호정책</Text>에
              동의하는 것으로 간주됩니다.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  keyboardContainer: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 20,
    justifyContent: "center",
  },
  signUpButtonContainer: {
    gap: 16,
  },
  loginContainer: {
    alignItems: "center",
    gap: 12,
  },
  loginText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "400",
  },
  loginButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
  },
  loginButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#8B4513",
    textDecorationLine: "underline",
  },
  header: {
    alignItems: "center",
    marginBottom: 40,
    position: "relative",
  },
  backButton: {
    position: "absolute",
    left: 0,
    top: 8,
    padding: 8,
    zIndex: 1,
  },
  logoContainer: {
    width: 80,
    height: 80,
    backgroundColor: "#fff",
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    shadowColor: "#000",
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
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 24,
    shadowColor: "#000",
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
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f8f8f8",
    borderRadius: 12,
    paddingHorizontal: 16,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  inputError: {
    borderColor: "#dc3545",
    borderWidth: 1.5,
  },
  errorText: {
    fontSize: 12,
    color: "#dc3545",
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: "400",
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    paddingVertical: 16,
    fontSize: 16,
    color: "#333",
  },
  passwordToggle: {
    padding: 4,
  },
  primaryButton: {
    backgroundColor: "#8B4513",
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: "center",
    marginTop: 8,
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  disabledButton: {
    opacity: 0.6,
  },
  buttonIcon: {
    marginRight: 4,
  },
  primaryButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
  termsContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  termsText: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
    lineHeight: 18,
  },
  linkText: {
    fontSize: 12,
    color: "#8B4513",
    fontWeight: "500",
    textDecorationLine: "underline",
  },
});
