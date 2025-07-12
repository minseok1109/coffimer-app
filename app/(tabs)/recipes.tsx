import RecipeCard from "@/components/RecipeCard";
import { useAuthContext } from "@/contexts/AuthContext";
import { useFavoriteRecipes } from "@/hooks/useFavorites";
import { useUserRecipes } from "@/hooks/useRecipes";
import { useFilteredRecipes } from "@/hooks/useFilteredRecipes";
import { useFilterState } from "@/hooks/useFilterState";
import { CompactFilterChipsContainer } from "@/components/filter";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type TabType = "myRecipes" | "favorites" | "all";

export default function RecipesScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabType>("myRecipes");
  const filterState = useFilterState();
  
  const { data: myRecipes, isLoading: myRecipesLoading, error: myRecipesError } = useUserRecipes(user?.id || "");
  const { data: favoriteRecipes, isLoading: favoritesLoading, error: favoritesError } = useFavoriteRecipes(user?.id || "");
  const { data: filteredRecipes, isLoading: filteredLoading, error: filteredError, isFetching: filteredFetching } = useFilteredRecipes(filterState.filterState, false);

  const handleAddRecipe = () => {
    router.push("/create-recipe");
  };

  const isLoading = activeTab === "myRecipes" ? myRecipesLoading : 
                    activeTab === "favorites" ? favoritesLoading : filteredLoading;
  const isFetching = activeTab === "myRecipes" ? myRecipesLoading : 
                     activeTab === "favorites" ? favoritesLoading : filteredFetching;
  const error = activeTab === "myRecipes" ? myRecipesError : 
                activeTab === "favorites" ? favoritesError : filteredError;
  const recipes = activeTab === "myRecipes" ? myRecipes : 
                  activeTab === "favorites" ? favoriteRecipes : filteredRecipes;

  // 초기 로딩 시에만 로딩 화면 표시 (이전 데이터가 없는 경우)
  if (isLoading && !recipes) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator size="large" color="#8B4513" />
          <Text style={styles.loadingText}>
            {activeTab === "myRecipes" ? "레시피를 불러오는 중..." : 
             activeTab === "favorites" ? "즐겨찾기를 불러오는 중..." : "레시피를 불러오는 중..."}
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, styles.centered]}>
          <Text style={styles.errorText}>
            {activeTab === "myRecipes" ? "레시피를 불러오는데 실패했습니다." : "즐겨찾기를 불러오는데 실패했습니다."}
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
        <Text style={styles.title}>
          {activeTab === "myRecipes" ? "내 레시피" : 
           activeTab === "favorites" ? "즐겨찾기" : "모든 레시피"}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity style={styles.addButton} onPress={handleAddRecipe}>
            <Ionicons name="add" size={24} color="white" />
          </TouchableOpacity>
        </View>
      </View>

      {/* 탭 네비게이션 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === "myRecipes" && styles.activeTab]}
          onPress={() => setActiveTab("myRecipes")}
        >
          <Text style={[styles.tabText, activeTab === "myRecipes" && styles.activeTabText]}>
            내 레시피
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "favorites" && styles.activeTab]}
          onPress={() => setActiveTab("favorites")}
        >
          <Text style={[styles.tabText, activeTab === "favorites" && styles.activeTabText]}>
            즐겨찾기
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === "all" && styles.activeTab]}
          onPress={() => setActiveTab("all")}
        >
          <Text style={[styles.tabText, activeTab === "all" && styles.activeTabText]}>
            모든 레시피
          </Text>
        </TouchableOpacity>
      </View>

      {/* 필터 칩 - 모든 레시피 탭에서만 표시 */}
      {activeTab === "all" && (
        <CompactFilterChipsContainer
          filterState={filterState.filterState}
          onBrewingTypeChange={filterState.setBrewingType}
          onDripperToggle={filterState.toggleDripper}
          onFilterToggle={filterState.toggleFilter}
          onReset={filterState.resetFilters}
          isLoading={isFetching}
        />
      )}

      <ScrollView contentContainerStyle={styles.scrollView}>
        {recipes && recipes.length > 0 ? (
          recipes.map((recipe) => (
            <RecipeCard 
              key={recipe.id} 
              recipe={recipe} 
              showFavorite={activeTab === "favorites"}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons 
              name={activeTab === "myRecipes" ? "document-outline" : 
                    activeTab === "favorites" ? "star-outline" : "search-outline"} 
              size={64} 
              color="#ccc" 
            />
            <Text style={styles.emptyText}>
              {activeTab === "myRecipes" 
                ? "아직 저장된 레시피가 없습니다" 
                : activeTab === "favorites" 
                ? "즐겨찾기한 레시피가 없습니다"
                : "조건에 맞는 레시피가 없습니다"}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === "myRecipes"
                ? "첫 번째 레시피를 추가해보세요!"
                : activeTab === "favorites"
                ? "마음에 드는 레시피를 즐겨찾기에 추가해보세요!"
                : "다른 필터 조건을 시도해보세요!"}
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
  tabContainer: {
    flexDirection: "row",
    backgroundColor: "#f5f5f5",
    marginHorizontal: 20,
    marginBottom: 20,
    borderRadius: 8,
    padding: 4,
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 6,
    alignItems: "center",
  },
  activeTab: {
    backgroundColor: "white",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  tabText: {
    fontSize: 14,
    fontWeight: "600",
    color: "#666",
  },
  activeTabText: {
    color: "#8B4513",
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
