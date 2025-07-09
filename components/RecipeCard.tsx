import { useDeleteRecipeMutation } from "@/hooks/useCreateRecipeMutation";
import { useFavoriteStatus, useFavoriteToggle } from "@/hooks/useFavorites";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Animated,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useAuth } from "../hooks/useAuth";
import { formatTimeKorean } from "../lib/timer/formatters";
import { Recipe } from "../types/recipe";

interface RecipeCardProps {
  recipe: Recipe;
  showMenu?: boolean;
  showFavorite?: boolean;
}

export default function RecipeCard({
  recipe,
  showMenu = true,
  showFavorite = true,
}: RecipeCardProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [overlayOpacity] = useState(new Animated.Value(0));
  const [slideAnim] = useState(new Animated.Value(300));
  const { mutate: deleteRecipe } = useDeleteRecipeMutation();

  // 즐겨찾기 관련 hooks
  const { data: isFavorited, isLoading: isFavoriteLoading } = useFavoriteStatus(
    user?.id || "",
    recipe.id,
  );
  const { mutate: toggleFavorite, isPending: isToggling } = useFavoriteToggle();

  // 소유자 확인
  const isOwner = user && recipe.owner_id && user.id === recipe.owner_id;

  const handlePress = () => {
    router.push(`/recipes/${recipe.id}`);
  };

  const handleMenuPress = () => {
    setShowActionSheet(true);
  };

  const handleFavoriteToggle = () => {
    if (!user?.id) {
      Alert.alert("로그인 필요", "즐겨찾기를 사용하려면 로그인이 필요합니다.");
      return;
    }

    toggleFavorite(
      { userId: user.id, recipeId: recipe.id },
      {
        onError: (error) => {
          console.error("즐겨찾기 토글 오류:", error);
          Alert.alert("오류", "즐겨찾기 설정 중 오류가 발생했습니다.");
        },
      },
    );
  };

  const closeActionSheet = () => {
    Animated.parallel([
      Animated.timing(overlayOpacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 300,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setShowActionSheet(false);
    });
  };

  useEffect(() => {
    if (showActionSheet) {
      Animated.parallel([
        Animated.timing(overlayOpacity, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [overlayOpacity, showActionSheet, slideAnim]);

  const handleEdit = () => {
    closeActionSheet();
    router.push(`/recipes/edit/${recipe.id}`);
  };

  const handleDelete = () => {
    closeActionSheet();
    Alert.alert(
      "레시피 삭제",
      "정말로 이 레시피를 삭제하시겠습니까? 삭제된 레시피는 복구할 수 없습니다.",
      [
        { text: "취소", style: "cancel" },
        {
          text: "삭제",
          style: "destructive",
          onPress: async () => {
            try {
              if (!user?.id) {
                Alert.alert("오류", "로그인이 필요합니다.");
                return;
              }

              deleteRecipe(recipe.id);
              Alert.alert("성공", "레시피가 삭제되었습니다.", [
                {
                  text: "확인",
                  onPress: () => {
                    // 레시피 목록 페이지로 이동
                    router.push("/(tabs)/recipes");
                  },
                },
              ]);
            } catch (error) {
              console.error("레시피 삭제 오류:", error);
              Alert.alert(
                "삭제 실패",
                error instanceof Error
                  ? error.message
                  : "레시피 삭제 중 오류가 발생했습니다.",
              );
            }
          },
        },
      ],
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>{recipe.name}</Text>
        <View style={styles.headerButtons}>
          {/* 즐겨찾기 버튼 */}
          {user && showFavorite && (
            <TouchableOpacity
              style={styles.favoriteButton}
              onPress={handleFavoriteToggle}
              disabled={isToggling || isFavoriteLoading}
            >
              <Ionicons
                name={isFavorited ? "star" : "star-outline"}
                size={20}
                color={isFavorited ? "#FFD700" : "#666"}
              />
            </TouchableOpacity>
          )}
          {/* 메뉴 버튼 (소유자만) */}
          {isOwner && showMenu && (
            <TouchableOpacity
              style={styles.menuButton}
              onPress={handleMenuPress}
            >
              <Ionicons name="ellipsis-vertical" size={20} color="#666" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <Text style={styles.description}>{recipe.description}</Text>

      <View style={styles.infoContainer}>
        <View style={styles.infoItem}>
          <Ionicons name="cafe-outline" size={16} color="#8B4513" />
          <Text style={styles.infoText}>{recipe.coffee}g</Text>
        </View>
        <View style={styles.infoItem}>
          <Ionicons name="time-outline" size={16} color="#666" />
          <Text style={styles.infoText}>
            {formatTimeKorean(recipe.total_time)}
          </Text>
        </View>
      </View>

      <TouchableOpacity style={styles.startButton} onPress={handlePress}>
        <Text style={styles.startButtonText}>레시피 시작하기</Text>
      </TouchableOpacity>

      {/* BottomSheet Modal */}
      <Modal
        visible={showActionSheet}
        transparent
        animationType="none"
        onRequestClose={closeActionSheet}
      >
        <Animated.View style={[styles.overlay, { opacity: overlayOpacity }]}>
          <TouchableOpacity
            style={styles.overlayTouchable}
            activeOpacity={1}
            onPress={closeActionSheet}
          >
            <Animated.View
              style={[
                styles.bottomSheetContent,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleEdit}
              >
                <Ionicons name="create-outline" size={20} color="#8B4513" />
                <Text style={styles.actionButtonText}>레시피 수정</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionButton}
                onPress={handleDelete}
              >
                <Ionicons name="trash-outline" size={20} color="#ff4444" />
                <Text style={[styles.actionButtonText, { color: "#ff4444" }]}>
                  레시피 삭제
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.cancelButton}
                onPress={closeActionSheet}
              >
                <Text style={styles.cancelButtonText}>취소</Text>
              </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "white",
    borderRadius: 12,
    padding: 20,
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
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  headerButtons: {
    flexDirection: "row",
    alignItems: "center",
    gap: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#333",
    flex: 1,
  },
  favoriteButton: {
    padding: 4,
  },
  menuButton: {
    padding: 4,
  },
  description: {
    fontSize: 14,
    color: "#666",
    lineHeight: 20,
    marginBottom: 16,
  },
  infoContainer: {
    flexDirection: "row",
    gap: 20,
    justifyContent: "space-between",
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  infoText: {
    fontSize: 14,
    color: "#666",
    fontWeight: "500",
  },
  startButton: {
    backgroundColor: "#D2691E",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  startButtonText: {
    color: "white",
    fontSize: 14,
    fontWeight: "bold",
  },
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.5)",
    justifyContent: "flex-end",
  },
  overlayTouchable: {
    flex: 1,
    justifyContent: "flex-end",
  },
  bottomSheetContent: {
    backgroundColor: "white",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
    minHeight: 200,
  },
  actionButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "#f8f9fa",
    borderRadius: 12,
    marginBottom: 12,
    gap: 12,
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#333",
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    backgroundColor: "white",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
    alignItems: "center",
    marginTop: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: "600",
    color: "#666",
  },
});
