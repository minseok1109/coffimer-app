import { useAuth } from "@/hooks/useAuth";
import {
  getPublicRecipes,
  getRecipeById,
  getUserRecipes,
} from "@/lib/recipeApi";
import { RecipeWithSteps } from "@/types/recipe";
import { useEffect, useState } from "react";

export const useUserRecipes = () => {
  const { user } = useAuth();
  const [recipes, setRecipes] = useState<RecipeWithSteps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchUserRecipes = async () => {
    if (!user) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getUserRecipes(user.id);

      if (result.success && result.data) {
        setRecipes(result.data);
      } else {
        setError(result.error || "레시피를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError("예상치 못한 오류가 발생했습니다.");
      console.error("레시피 조회 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserRecipes();
  }, [user]);

  return {
    recipes,
    loading,
    error,
    refetch: fetchUserRecipes,
  };
};

export const usePublicRecipes = () => {
  const [recipes, setRecipes] = useState<RecipeWithSteps[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPublicRecipes = async () => {
    setLoading(true);
    setError(null);

    try {
      const result = await getPublicRecipes();

      if (result.success && result.data) {
        setRecipes(result.data);
      } else {
        setError(result.error || "공개 레시피를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError("예상치 못한 오류가 발생했습니다.");
      console.error("공개 레시피 조회 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPublicRecipes();
  }, []);

  return {
    recipes,
    loading,
    error,
    refetch: fetchPublicRecipes,
  };
};

export const useRecipeDetail = (recipeId: string | null) => {
  const [recipe, setRecipe] = useState<RecipeWithSteps | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchRecipe = async () => {
    if (!recipeId) return;

    setLoading(true);
    setError(null);

    try {
      const result = await getRecipeById(recipeId);

      if (result.success && result.data) {
        setRecipe(result.data);
      } else {
        setError(result.error || "레시피를 불러오는데 실패했습니다.");
      }
    } catch (err) {
      setError("예상치 못한 오류가 발생했습니다.");
      console.error("레시피 상세 조회 오류:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRecipe();
  }, [recipeId]);

  return {
    recipe,
    loading,
    error,
    refetch: fetchRecipe,
  };
};
