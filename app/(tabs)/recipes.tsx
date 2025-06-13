import { Ionicons } from "@expo/vector-icons";
import { StatusBar } from "expo-status-bar";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

interface Recipe {
  id: string;
  title: string;
  description: string;
  ingredients: string[];
  difficulty: "Easy" | "Medium" | "Hard";
  time: string;
}

export default function RecipesScreen() {
  const [searchQuery, setSearchQuery] = useState("");
  const [recipes] = useState<Recipe[]>([
    {
      id: "1",
      title: "아메리카노",
      description: "깔끔하고 진한 에스프레소의 맛을 물과 함께 즐기는 기본 커피",
      ingredients: ["에스프레소 샷 2개", "뜨거운 물 120ml"],
      difficulty: "Easy",
      time: "3분",
    },
    {
      id: "2",
      title: "카페라떼",
      description: "부드러운 우유거품과 에스프레소의 완벽한 조화",
      ingredients: ["에스프레소 샷 2개", "우유 150ml"],
      difficulty: "Medium",
      time: "5분",
    },
    {
      id: "3",
      title: "카푸치노",
      description: "진한 에스프레소와 풍성한 우유거품의 클래식한 조합",
      ingredients: ["에스프레소 샷 1개", "우유 100ml", "우유거품"],
      difficulty: "Medium",
      time: "7분",
    },
  ]);

  const filteredRecipes = recipes.filter((recipe) =>
    recipe.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getDifficultyColor = (difficulty: Recipe["difficulty"]) => {
    switch (difficulty) {
      case "Easy":
        return "#4CAF50";
      case "Medium":
        return "#FF9800";
      case "Hard":
        return "#F44336";
      default:
        return "#757575";
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.title}>내 레시피</Text>
        <TouchableOpacity style={styles.addButton}>
          <Ionicons name="add" size={24} color="white" />
        </TouchableOpacity>
      </View>

      <View style={styles.searchContainer}>
        <Ionicons
          name="search"
          size={20}
          color="#999"
          style={styles.searchIcon}
        />
        <TextInput
          style={styles.searchInput}
          placeholder="레시피 검색..."
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {filteredRecipes.map((recipe) => (
          <TouchableOpacity key={recipe.id} style={styles.recipeCard}>
            <View style={styles.recipeHeader}>
              <Text style={styles.recipeTitle}>{recipe.title}</Text>
              <View
                style={[
                  styles.difficultyBadge,
                  { backgroundColor: getDifficultyColor(recipe.difficulty) },
                ]}
              >
                <Text style={styles.difficultyText}>{recipe.difficulty}</Text>
              </View>
            </View>

            <Text style={styles.recipeDescription}>{recipe.description}</Text>

            <View style={styles.recipeInfo}>
              <View style={styles.timeContainer}>
                <Ionicons name="time-outline" size={16} color="#666" />
                <Text style={styles.timeText}>{recipe.time}</Text>
              </View>
            </View>

            <View style={styles.ingredientsContainer}>
              <Text style={styles.ingredientsTitle}>재료:</Text>
              {recipe.ingredients.map((ingredient, index) => (
                <Text key={index} style={styles.ingredient}>
                  • {ingredient}
                </Text>
              ))}
            </View>
          </TouchableOpacity>
        ))}

        {filteredRecipes.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="document-outline" size={64} color="#ccc" />
            <Text style={styles.emptyText}>
              {searchQuery
                ? "검색 결과가 없습니다"
                : "아직 저장된 레시피가 없습니다"}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery
                ? "다른 키워드로 검색해보세요"
                : "첫 번째 레시피를 추가해보세요!"}
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
  addButton: {
    backgroundColor: "#8B4513",
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "white",
    marginHorizontal: 20,
    marginBottom: 20,
    paddingHorizontal: 15,
    borderRadius: 25,
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 16,
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
});
