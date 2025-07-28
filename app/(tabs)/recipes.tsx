import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import RecipeCard from '@/components/RecipeCard';
import { useAuthContext } from '@/contexts/AuthContext';
import { useFavoriteRecipes } from '@/hooks/useFavorites';
import { useUserRecipes } from '@/hooks/useRecipes';

type TabType = 'myRecipes' | 'favorites';

export default function RecipesScreen() {
  const router = useRouter();
  const { user } = useAuthContext();
  const [activeTab, setActiveTab] = useState<TabType>('myRecipes');
  const {
    data: myRecipes,
    isLoading: myRecipesLoading,
    error: myRecipesError,
  } = useUserRecipes(user?.id || '');
  const {
    data: favoriteRecipes,
    isLoading: favoritesLoading,
    error: favoritesError,
  } = useFavoriteRecipes(user?.id || '');

  const handleAddRecipe = () => {
    router.push('/create-recipe');
  };

  const isLoading =
    activeTab === 'myRecipes' ? myRecipesLoading : favoritesLoading;
  const error = activeTab === 'myRecipes' ? myRecipesError : favoritesError;
  const recipes = activeTab === 'myRecipes' ? myRecipes : favoriteRecipes;

  // 초기 로딩 시에만 로딩 화면 표시 (이전 데이터가 없는 경우)
  if (isLoading && !recipes) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={[styles.container, styles.centered]}>
          <ActivityIndicator color="#8B4513" size="large" />
          <Text style={styles.loadingText}>
            {activeTab === 'myRecipes'
              ? '레시피를 불러오는 중...'
              : '즐겨찾기를 불러오는 중...'}
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
            {activeTab === 'myRecipes'
              ? '레시피를 불러오는데 실패했습니다.'
              : '즐겨찾기를 불러오는데 실패했습니다.'}
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
          {activeTab === 'myRecipes' ? '내 레시피' : '즐겨찾기'}
        </Text>
        <View style={styles.headerButtons}>
          <TouchableOpacity onPress={handleAddRecipe} style={styles.addButton}>
            <Ionicons color="white" name="add" size={24} />
          </TouchableOpacity>
        </View>
      </View>

      {/* 탭 네비게이션 */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          onPress={() => setActiveTab('myRecipes')}
          style={[styles.tab, activeTab === 'myRecipes' && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'myRecipes' && styles.activeTabText,
            ]}
          >
            내 레시피
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('favorites')}
          style={[styles.tab, activeTab === 'favorites' && styles.activeTab]}
        >
          <Text
            style={[
              styles.tabText,
              activeTab === 'favorites' && styles.activeTabText,
            ]}
          >
            즐겨찾기
          </Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollView}>
        {recipes && recipes.length > 0 ? (
          recipes.map((recipe) => (
            <RecipeCard
              key={recipe.id}
              recipe={recipe}
              showFavorite={activeTab === 'favorites'}
            />
          ))
        ) : (
          <View style={styles.emptyState}>
            <Ionicons
              color="#ccc"
              name={
                activeTab === 'myRecipes' ? 'document-outline' : 'star-outline'
              }
              size={64}
            />
            <Text style={styles.emptyText}>
              {activeTab === 'myRecipes'
                ? '아직 저장된 레시피가 없습니다'
                : '즐겨찾기한 레시피가 없습니다'}
            </Text>
            <Text style={styles.emptySubtext}>
              {activeTab === 'myRecipes'
                ? '첫 번째 레시피를 추가해보세요!'
                : '마음에 드는 레시피를 즐겨찾기에 추가해보세요!'}
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
    backgroundColor: '#f5f5f5',
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    paddingTop: 10,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#333',
  },
  headerButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  logoutButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addButton: {
    backgroundColor: '#8B4513',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#f5f5f5',
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
    alignItems: 'center',
  },
  activeTab: {
    backgroundColor: 'white',
    shadowColor: '#000',
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
    fontWeight: '600',
    color: '#666',
  },
  activeTabText: {
    color: '#8B4513',
  },
  scrollView: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  recipeCard: {
    backgroundColor: 'white',
    padding: 20,
    borderRadius: 12,
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
  recipeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  recipeTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    flex: 1,
  },
  difficultyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  difficultyText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  recipeDescription: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
    lineHeight: 20,
  },
  recipeInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  timeText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  ingredientsContainer: {
    marginTop: 8,
  },
  ingredientsTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  ingredient: {
    fontSize: 14,
    color: '#666',
    marginBottom: 2,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 60,
  },
  emptyText: {
    fontSize: 18,
    color: '#999',
    marginTop: 16,
    textAlign: 'center',
  },
  emptySubtext: {
    fontSize: 14,
    color: '#ccc',
    marginTop: 8,
    textAlign: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  errorText: {
    fontSize: 18,
    color: '#d32f2f',
    textAlign: 'center',
    marginBottom: 10,
  },
  errorDetail: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});
