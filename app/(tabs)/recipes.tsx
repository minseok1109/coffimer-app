import RecipeCard from "@/components/RecipeCard";
import { useAuthContext } from "@/contexts/AuthContext";
import { useUserRecipes } from "@/hooks/useRecipes";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function RecipesScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const { data: myRecipes, isLoading, error } = useUserRecipes(user?.id || "");

  const handleAddRecipe = () => {
    router.push("/create-recipe");
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>레시피를 불러오는 중...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.errorText}>
            레시피를 불러오는데 실패했습니다.
          </Text>
          <Text style={styles.errorDetail}>{error.message}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.title}>내 레시피</Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddRecipe}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {myRecipes && myRecipes.length > 0 ? (
          myRecipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>아직 저장된 레시피가 없습니다</Text>
            <Text style={styles.emptySubtext}>
              첫 번째 레시피를 추가해보세요!
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#333",
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "#f0f0f0",
    justifyContent: "center",
    alignItems: "center",
  },
  addButton: {
    backgroundColor: "#8B4513",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipeCard: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 12,
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
  recipeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: "white",
    fontSize: 12,
    fontWeight: "bold",
  },
  recipeDescription: {
    fontSize: 14,
    color: "#666",
    marginBottom: 12,
    lineHeight: 20,
  },
  recipeInfo: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  timeText: {
    marginLeft: 4,
    fontSize: 14,
    color: "#666",
  },
  ingredientsContainer: {
    marginTop: 8,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#333",
    marginBottom: 4,
  },
  ingredient: {
    fontSize: 14,
    color: "#666",
    marginBottom: 2,
  },
  emptyState: {
    alignItems: "center",
    justifyContent: "center",
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: "#999",
    marginTop: 16,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#ccc",
    marginTop: 8,
    textAlign: "center",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    color: "#d32f2f",
    textAlign: "center",
    marginBottom: 10,
  },
  errorDetail: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
});
