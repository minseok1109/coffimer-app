import { ErrorMessage } from "@/components/auth";
import { useAuthContext } from "@/contexts/AuthContext";
import { type SignUpFormData, signUpSchema } from "@/lib/validation/authSchema";
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
              onPress={() => router.back()}
              style={styles.backButton}
            >
              <Ionicons color="#8B4513" name="chevron-back" size={24} />
            </TouchableOpacity>
            <View style={styles.logoContainer}>
              <Image
                resizeMode="contain"
                source={require("@/assets/images/logo.png")}
                style={styles.logoImage}
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
                    color={errors.nickname ? "#dc3545" : "#666"}
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
                    color={errors.email ? "#dc3545" : "#666"}
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
                    color={errors.password ? "#dc3545" : "#666"}
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
                      name={showPassword ? "eye-outline" : "eye-off-outline"}
                      size={20}
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
                    color={errors.confirmPassword ? "#dc3545" : "#666"}
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
                    onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                    style={styles.passwordToggle}
                  >
                    <Ionicons
                      color="#666"
                      name={
                        showConfirmPassword ? "eye-outline" : "eye-off-outline"
                      }
                      size={20}
                    />
                  </TouchableOpacity>
                </View>
                <ErrorMessage message={errors.confirmPassword?.message || ""} />
              </View>

              <View style={styles.signUpButtonContainer}>
                <TouchableOpacity
                  // disabled={loading || !isValid}
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
                      <Text style={styles.primaryButtonText}>계정 만들기</Text>
                    </>
                  )}
                </TouchableOpacity>

                <View style={styles.loginContainer}>
                  <Text style={styles.loginText}>이미 계정이 있으신가요?</Text>
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
