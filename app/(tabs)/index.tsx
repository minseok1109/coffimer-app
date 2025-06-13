import { StatusBar } from "expo-status-bar";
import React from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import RecipeCard from "../../components/RecipeCard";
import { getAllRecipes } from "../../lib/recipes";

export default function HomeScreen() {
  const recipes = getAllRecipes();

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar style="auto" />

      <View style={styles.header}>
        <Text style={styles.title}>☕ Coffimer</Text>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.content}>
          {recipes.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} />
          ))}
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
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#8B4513",
  },
  scrollView: {
    flexGrow: 1,
    padding: 20,
  },
  content: {
    gap: 0, // RecipeCard 컴포넌트에서 marginBottom으로 간격 조절
  },
});
