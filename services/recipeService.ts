import type { FilterState } from '@/constants/filterConstants';
import { supabase } from '@/lib/supabaseClient';
import type { Recipe, RecipeFilterOptions, RecipeWithSteps } from '../types/recipe';

export class RecipeService {
  /**
   * 특정 ID의 레시피를 조회합니다 (steps 포함)
   */
  static async getRecipeById(recipeId: string): Promise<RecipeWithSteps> {
    const { data: recipe, error: recipeError } = await supabase
      .from('recipes')
      .select(
        `
        *,
        recipe_steps (*),
        users!recipes_owner_id_fkey (id, display_name, profile_image)
      `
      )
      .eq('id', recipeId)
      .single();

    if (recipeError) {
      throw new Error(`Failed to fetch recipe: ${recipeError.message}`);
    }

    if (!recipe) {
      throw new Error('Recipe not found');
    }

    return recipe as unknown as RecipeWithSteps;
  }

  /**
   * 모든 공개 레시피를 조회합니다
   */
  static async getAllRecipes(
    includeSteps = false
  ): Promise<Recipe[] | RecipeWithSteps[]> {
    if (!includeSteps) {
      const { data: recipes, error } = await supabase
        .from('recipes')
        .select('*')
        .eq('is_public', true)
        .order('created_at', { ascending: false });

      if (error) {
        throw new Error(`Failed to fetch recipes: ${error.message}`);
      }

      return recipes ?? [];
    }

    const { data: recipes, error } = await supabase
      .from('recipes')
      .select(
        `
        *,
        recipe_steps (*),
        users!recipes_owner_id_fkey (id, display_name, profile_image)
        `
      )
      .eq('is_public', true)
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch recipes: ${error.message}`);
    }

    return (recipes ?? []) as unknown as RecipeWithSteps[];
  }

  /**
   * 검색어로 레시피를 검색합니다
   */
  static async searchRecipes(
    searchTerm: string,
    includeSteps = false
  ): Promise<Recipe[] | RecipeWithSteps[]> {
    if (!searchTerm.trim()) {
      return RecipeService.getAllRecipes(includeSteps);
    }

    const selectQuery = includeSteps
      ? `
        *,
        recipe_steps (*),
        users!recipes_owner_id_fkey (id, display_name, profile_image)
      `
      : '*';

    const { data: recipes, error } = await supabase
      .from('recipes')
      .select(selectQuery)
      .eq('is_public', true)
      .or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to search recipes: ${error.message}`);
    }

    return (recipes ?? []) as unknown as (Recipe[] | RecipeWithSteps[]);
  }

  /**
   * 특정 드리퍼로 필터링된 레시피를 조회합니다
   */
  static async getRecipesByDripper(dripper: string): Promise<Recipe[]> {
    const { data: recipes, error } = await supabase
      .from('recipes')
      .select('*')
      .eq('is_public', true)
      .eq('dripper', dripper)
      .order('created_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to fetch recipes by dripper: ${error.message}`);
    }

    return recipes || [];
  }

  /**
   * 필터 옵션(드리퍼/필터/추출타입)을 단일 RPC로 조회합니다
   */
  static async getFilterOptions(): Promise<RecipeFilterOptions> {
    const { data, error } = await supabase.rpc('get_recipe_filter_options' as never);

    if (error) {
      throw new Error(`Failed to fetch filter options: ${error.message}`);
    }

    return data as unknown as RecipeFilterOptions;
  }

  /**
   * 필터 조건에 따라 레시피를 조회합니다
   */
  static async getFilteredRecipes(
    filters: FilterState,
    includeSteps = false
  ): Promise<Recipe[] | RecipeWithSteps[]> {
    const selectQuery = includeSteps
      ? `
        *,
        recipe_steps (*),
        users!recipes_owner_id_fkey (id, display_name, profile_image)
      `
      : '*';

    let query = supabase
      .from('recipes')
      .select(selectQuery)
      .eq('is_public', true);

    if (filters.brewingType !== 'all') {
      query = query.eq('brewing_type', filters.brewingType);
    }

    if (filters.dripper.length > 0) {
      const dripperConditions: string[] = [];

      for (const filterValue of filters.dripper) {
        switch (filterValue) {
          case 'v60':
            dripperConditions.push('dripper.ilike.*v60*');
            break;
          case 'origami':
            dripperConditions.push('dripper.ilike.*오리가미*');
            dripperConditions.push('dripper.ilike.*origami*');
            break;
          case 'solo':
            dripperConditions.push('dripper.ilike.*솔로*');
            break;
          case 'hario':
            dripperConditions.push('dripper.ilike.*하리오*');
            dripperConditions.push('dripper.ilike.*hario*');
            break;
          case 'other':
            break;
          default:
            dripperConditions.push(`dripper.ilike.*${filterValue}*`);
        }
      }

      if (dripperConditions.length > 0) {
        query = query.or(dripperConditions.join(','));
      }
    }

    if (filters.filter.length > 0) {
      const filterConditions: string[] = [];

      for (const filterValue of filters.filter) {
        switch (filterValue) {
          case 'cafec_abaca':
            filterConditions.push('filter.ilike.*카펙*');
            filterConditions.push('filter.ilike.*cafec*');
            filterConditions.push('filter.ilike.*아바카*');
            filterConditions.push('filter.ilike.*abaca*');
            break;
          case 'kalita_wave':
            filterConditions.push('filter.ilike.*칼리타*');
            filterConditions.push('filter.ilike.*kalita*');
            filterConditions.push('filter.ilike.*웨이브*');
            filterConditions.push('filter.ilike.*wave*');
            break;
          case 'v60_paper':
            filterConditions.push('filter.ilike.*v60*');
            filterConditions.push('filter.ilike.*전용*');
            break;
          case 'origami_cone':
            filterConditions.push('filter.ilike.*오리가미*');
            filterConditions.push('filter.ilike.*origami*');
            filterConditions.push('filter.ilike.*콘*');
            break;
          case 'none':
            filterConditions.push('filter.is.null');
            break;
          default:
            filterConditions.push(`filter.ilike.*${filterValue}*`);
        }
      }

      if (filterConditions.length > 0) {
        query = query.or(filterConditions.join(','));
      }
    }

    query = query.order('created_at', { ascending: true });

    const { data: recipes, error } = await query;

    if (error) {
      throw new Error(`Failed to fetch filtered recipes: ${error.message}`);
    }

    return (recipes ?? []) as unknown as (Recipe[] | RecipeWithSteps[]);
  }

}
