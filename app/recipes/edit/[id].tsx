import { useRecipe } from "@/hooks/useRecipes";
import { useAuth } from "@/hooks/useAuth";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { EditForm } from "@/components/recipe/EditForm";
import { RecipeEditFormData } from "@/lib/validation/recipeSchema";
import { RecipeAPI } from "@/lib/api/recipes";

export default function RecipeEditPage() {
  const { id } = useLocalSearchParams();
  const router = useRouter();
  const { data: recipe, isLoading, error } = useRecipe(id as string);
  const { user, loading: authLoading } = useAuth();

  const currentUserId = user?.id;

  if (isLoading || authLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>레시피 수정</Text>
        </View>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>
            {isLoading ? "레시피를 불러오는 중..." : "사용자 정보를 확인하는 중..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error || !recipe) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>레시피 수정</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="alert-circle-outline" size={64} color="#FF6B6B" />
          <Text style={styles.errorTitle}>레시피를 찾을 수 없습니다</Text>
          <Text style={styles.errorText}>
            요청하신 레시피가 존재하지 않거나 삭제되었습니다.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 로그인 확인
  if (!user) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>레시피 수정</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="person-outline" size={64} color="#FFA500" />
          <Text style={styles.errorTitle}>로그인이 필요합니다</Text>
          <Text style={styles.errorText}>
            레시피를 수정하려면 먼저 로그인해주세요.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.push("/auth/login")}
          >
            <Text style={styles.errorButtonText}>로그인하기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // 권한 확인: 현재 사용자가 레시피 소유자인지 확인
  const isOwner = currentUserId && recipe.owner_id === currentUserId;

  if (!isOwner) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>레시피 수정</Text>
        </View>
        <View style={styles.errorContainer}>
          <Ionicons name="lock-closed-outline" size={64} color="#FFA500" />
          <Text style={styles.errorTitle}>수정 권한이 없습니다</Text>
          <Text style={styles.errorText}>
            이 레시피는 다른 사용자가 작성한 레시피입니다.{"\n"}
            본인이 작성한 레시피만 수정할 수 있습니다.
          </Text>
          <TouchableOpacity
            style={styles.errorButton}
            onPress={() => router.back()}
          >
            <Text style={styles.errorButtonText}>돌아가기</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const handleSave = async (data: RecipeEditFormData) => {
    try {
      if (!currentUserId) {
        throw new Error("로그인이 필요합니다.");
      }

      await RecipeAPI.updateRecipe(recipe.id, data, currentUserId);
      
      // 수정 완료 후 상세 페이지로 이동
      router.replace(`/recipes/${recipe.id}`);
    } catch (error) {
      console.error("레시피 수정 오류:", error);
      throw error; // EditForm에서 에러 처리
    }
  };

  const handleCancel = () => {
    router.back();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>레시피 수정</Text>
      </View>

      <EditForm
        recipe={recipe}
        onSave={handleSave}
        onCancel={handleCancel}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f8f9fa",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 20,
    backgroundColor: "white",
    borderBottomWidth: 1,
    borderBottomColor: "#e9ecef",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
    marginLeft: 16,
    color: "#333",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    marginTop: 16,
    marginBottom: 8,
    textAlign: "center",
  },
  errorText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 32,
  },
  errorButton: {
    backgroundColor: "#8B4513",
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  errorButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "600",
  },
});