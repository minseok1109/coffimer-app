import { useAuthContext } from "@/contexts/AuthContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import * as WebBrowser from "expo-web-browser";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface InfoItem {
  id: string;
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
  hasArrow?: boolean;
  onPress?: () => void;
}

export default function InfoScreen() {
  const router = useRouter();
  const { deleteAccount } = useAuthContext();
  const [isDeleting, setIsDeleting] = useState(false);

  const basicInfo: InfoItem[] = [
    {
      id: "name",
      title: "앱 이름",
      subtitle: "Coffimer",
      icon: "cafe-outline",
    },
    {
      id: "version",
      title: "버전",
      subtitle: "1.0.0",
      icon: "information-circle-outline",
    },
    {
      id: "developer",
      title: "개발자",
      subtitle: "Bang Minseok",
      icon: "person-outline",
    },
    {
      id: "contact",
      title: "문의하기",
      subtitle: "minseok32@gmail.com",
      icon: "mail-outline",
      hasArrow: true,
      onPress: () => Linking.openURL("mailto:minseok32@gmail.com"),
    },
  ];

  const handleDeleteAccount = () => {
    Alert.alert(
      "계정 탈퇴",
      "정말로 계정을 삭제하시겠습니까?\n\n• 모든 개인 데이터가 영구적으로 삭제됩니다\n• 생성한 레시피와 저장된 데이터가 모두 사라집니다\n• 이 작업은 되돌릴 수 없습니다",
      [
        {
          text: "취소",
          style: "cancel",
        },
        {
          text: "탈퇴하기",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "최종 확인",
              "계정 탈퇴를 진행하시겠습니까?\n삭제된 데이터는 복구할 수 없습니다.",
              [
                {
                  text: "취소",
                  style: "cancel",
                },
                {
                  text: "확인",
                  style: "destructive",
                  onPress: async () => {
                    setIsDeleting(true);
                    try {
                      const result = await deleteAccount();
                      if (result.success) {
                        Alert.alert(
                          "탈퇴 완료",
                          "계정이 성공적으로 삭제되었습니다.",
                          [
                            {
                              text: "확인",
                              onPress: () => router.replace("/auth/login"),
                            },
                          ]
                        );
                      } else {
                        Alert.alert(
                          "오류",
                          (result.error as Error)?.message ||
                            "계정 삭제에 실패했습니다."
                        );
                      }
                    } catch (error) {
                      Alert.alert("오류", "계정 삭제 중 오류가 발생했습니다.");
                    } finally {
                      setIsDeleting(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  const legalInfo: InfoItem[] = [
    {
      id: "privacy",
      title: "개인정보 보호정책",
      icon: "shield-checkmark-outline",
      hasArrow: true,
      onPress: () => {
        // 실제 운영 시에는 정책 페이지 URL로 변경
        WebBrowser.openBrowserAsync("https://coffimer.app/terms");
      },
    },
    {
      id: "terms",
      title: "서비스 이용약관",
      icon: "document-text-outline",
      hasArrow: true,
      onPress: () => {
        // 실제 운영 시에는 약관 페이지 URL로 변경
        WebBrowser.openBrowserAsync("https://coffimer.com/terms");
      },
    },
    {
      id: "licenses",
      title: "오픈소스 라이선스",
      icon: "code-outline",
      hasArrow: true,
      onPress: () => router.push("/licenses"),
    },
  ];

  const techInfo: InfoItem[] = [
    {
      id: "platform",
      title: "플랫폼",
      subtitle: "React Native with Expo",
      icon: "phone-portrait-outline",
    },
    {
      id: "permissions",
      title: "사용 권한",
      subtitle: "알림, 오디오 재생",
      icon: "settings-outline",
    },
    {
      id: "storage",
      title: "데이터 저장",
      subtitle: "Supabase (암호화됨)",
      icon: "cloud-outline",
    },
  ];

  const renderInfoItem = (item: InfoItem) => (
    <TouchableOpacity
      key={item.id}
      style={styles.infoItem}
      onPress={item.onPress}
      disabled={!item.onPress}
    >
      <View style={styles.infoLeft}>
        <Ionicons name={item.icon} size={24} color="#666" />
        <View style={styles.infoTextContainer}>
          <Text style={styles.infoTitle}>{item.title}</Text>
          {item.subtitle && (
            <Text style={styles.infoSubtitle}>{item.subtitle}</Text>
          )}
        </View>
      </View>
      <View style={styles.infoRight}>
        {item.hasArrow && (
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        )}
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>앱 정보</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {/* App Icon Section */}
        <View style={styles.appIconSection}>
          <View style={styles.appIconContainer}>
            <Ionicons name="cafe" size={60} color="#8B4513" />
          </View>
          <Text style={styles.appName}>Coffimer</Text>
          <Text style={styles.appDescription}>
            완벽한 커피를 위한 타이머 앱
          </Text>
        </View>

        {/* Basic Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기본 정보</Text>
          <View style={styles.infoContainer}>
            {basicInfo.map((item, index) => (
              <View key={item.id}>
                {renderInfoItem(item)}
                {index < basicInfo.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Legal Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>법적 정보</Text>
          <View style={styles.infoContainer}>
            {legalInfo.map((item, index) => (
              <View key={item.id}>
                {renderInfoItem(item)}
                {index < legalInfo.length - 1 && (
                  <View style={styles.divider} />
                )}
              </View>
            ))}
          </View>
        </View>

        {/* Technical Information */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>기술 정보</Text>
          <View style={styles.infoContainer}>
            {techInfo.map((item, index) => (
              <View key={item.id}>
                {renderInfoItem(item)}
                {index < techInfo.length - 1 && <View style={styles.divider} />}
              </View>
            ))}
          </View>
        </View>

        {/* 계정 관리 섹션 */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>계정 관리</Text>
          <View style={styles.infoContainer}>
            <TouchableOpacity
              style={[styles.infoItem, styles.deleteAccountItem]}
              onPress={handleDeleteAccount}
              disabled={isDeleting}
            >
              <View style={styles.infoLeft}>
                <Ionicons
                  name="trash-outline"
                  size={24}
                  color={isDeleting ? "#ccc" : "#ff4444"}
                />
                <View style={styles.infoTextContainer}>
                  <Text style={[styles.infoTitle, styles.deleteAccountText]}>
                    {isDeleting ? "탈퇴 처리 중..." : "계정 탈퇴"}
                  </Text>
                  <Text style={styles.infoSubtitle}>
                    모든 데이터가 영구적으로 삭제됩니다
                  </Text>
                </View>
              </View>
              <View style={styles.infoRight}>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </View>
            </TouchableOpacity>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            © 2024 Bang Minseok. All rights reserved.
          </Text>
          <Text style={styles.footerSubtext}>
            이 앱은 커피 애호가들을 위해 만들어졌습니다.
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 12,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  backButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
  },
  placeholder: {
    width: 32,
  },
  scrollView: {
    paddingBottom: 30,
  },
  appIconSection: {
    alignItems: "center",
    backgroundColor: "white",
    paddingVertical: 40,
    marginBottom: 20,
  },
  appIconContainer: {
    width: 100,
    height: 100,
    borderRadius: 22,
    backgroundColor: "#f8f4f1",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: "#e8e8e8",
  },
  appName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#8B4513",
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    marginLeft: 20,
    marginBottom: 12,
  },
  infoContainer: {
    backgroundColor: "white",
    marginHorizontal: 20,
    borderRadius: 12,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  infoItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  infoLeft: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  infoTextContainer: {
    marginLeft: 12,
    flex: 1,
  },
  infoTitle: {
    fontSize: 16,
    color: "#333",
    fontWeight: "500",
  },
  infoSubtitle: {
    fontSize: 14,
    color: "#666",
    marginTop: 2,
  },
  infoRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  divider: {
    height: 1,
    backgroundColor: "#f0f0f0",
    marginLeft: 56,
  },
  footer: {
    alignItems: "center",
    paddingVertical: 30,
    paddingHorizontal: 20,
  },
  footerText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginBottom: 8,
  },
  footerSubtext: {
    fontSize: 12,
    color: "#999",
    textAlign: "center",
  },
  deleteAccountItem: {
    backgroundColor: "#fff5f5",
  },
  deleteAccountText: {
    color: "#ff4444",
    fontWeight: "600",
  },
});
