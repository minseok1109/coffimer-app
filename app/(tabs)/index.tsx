import { CompactFilterChipsContainer } from "@/components/filter";
import RecipeCard from "@/components/RecipeCard";
import { useFilteredRecipes } from "@/hooks/useFilteredRecipes";
import { useFilterState } from "@/hooks/useFilterState";
import { useAnalytics } from "@/hooks/useAnalytics";
import { StatusBar } from "expo-status-bar";
import React from "react";
import {
  ActivityIndicator,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function HomeScreen() {
  const filterState = useFilterState();
  const {
    data: recipes,
    error,
    isLoading,
    isFetching,
  } = useFilteredRecipes(filterState.filterState, false);
  const { testConnection, screen } = useAnalytics();

  // Test analytics connection and track screen view on mount
  React.useEffect(() => {
    testConnection();
    screen("HomeScreen");
  }, [testConnection, screen]);

  // 초기 로딩 시에만 로딩 화면 표시 (이전 데이터가 없는 경우)
  if (isLoading && !recipes) {
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
        <Image
          source={require("@/assets/images/logo.png")}
          style={styles.logo}
        />
        <Text style={styles.title}>Coffimer</Text>
      </View>

      <CompactFilterChipsContainer
        filterState={filterState.filterState}
        onBrewingTypeChange={filterState.setBrewingType}
        onDripperToggle={filterState.toggleDripper}
        onFilterToggle={filterState.toggleFilter}
        onReset={filterState.resetFilters}
        isLoading={isFetching}
      />

      <ScrollView contentContainerStyle={styles.scrollView}>
        <View style={styles.content}>
          {recipes?.map((recipe) => (
            <RecipeCard key={recipe.id} recipe={recipe} showMenu={false} />
          )) ?? <Text style={styles.noDataText}>레시피가 없습니다.</Text>}
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
  centered: {
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    backgroundColor: "white",
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
    flexDirection: "row",
    alignItems: "center",
  },
  logo: {
    width: 24,
    height: 24,
    marginRight: 8,
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
  noDataText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 50,
  },
});
