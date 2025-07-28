export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  // Allows to automatically instanciate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: '12.2.3 (519615d)';
  };
  public: {
    Tables: {
      daily_user_stats: {
        Row: {
          avg_session_duration: unknown | null;
          bounce_rate: number | null;
          created_at: string | null;
          date: string;
          device_stats: Json | null;
          new_users: number | null;
          returning_users: number | null;
          top_pages: Json | null;
          top_recipes: Json | null;
          total_page_views: number | null;
          total_recipe_views: number | null;
          total_sessions: number | null;
          unique_users: number | null;
          updated_at: string | null;
        };
        Insert: {
          avg_session_duration?: unknown | null;
          bounce_rate?: number | null;
          created_at?: string | null;
          date: string;
          device_stats?: Json | null;
          new_users?: number | null;
          returning_users?: number | null;
          top_pages?: Json | null;
          top_recipes?: Json | null;
          total_page_views?: number | null;
          total_recipe_views?: number | null;
          total_sessions?: number | null;
          unique_users?: number | null;
          updated_at?: string | null;
        };
        Update: {
          avg_session_duration?: unknown | null;
          bounce_rate?: number | null;
          created_at?: string | null;
          date?: string;
          device_stats?: Json | null;
          new_users?: number | null;
          returning_users?: number | null;
          top_pages?: Json | null;
          top_recipes?: Json | null;
          total_page_views?: number | null;
          total_recipe_views?: number | null;
          total_sessions?: number | null;
          unique_users?: number | null;
          updated_at?: string | null;
        };
        Relationships: [];
      };
      likes: {
        Row: {
          created_at: string;
          recipe_id: string;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          recipe_id: string;
          user_id: string;
        };
        Update: {
          created_at?: string;
          recipe_id?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'likes_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'likes_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'v_today_popular_recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'likes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      recent_views: {
        Row: {
          recipe_id: string;
          user_id: string;
          viewed_at: string;
        };
        Insert: {
          recipe_id: string;
          user_id: string;
          viewed_at?: string;
        };
        Update: {
          recipe_id?: string;
          user_id?: string;
          viewed_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'recent_views_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recent_views_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'v_today_popular_recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recent_views_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_analytics: {
        Row: {
          all_time_score: number | null;
          avg_completion_rate: number | null;
          avg_scroll_depth: number | null;
          avg_view_duration: unknown | null;
          created_at: string | null;
          last_trending_at: string | null;
          peak_daily_views: number | null;
          peak_date: string | null;
          recipe_id: string;
          total_likes: number | null;
          total_saves: number | null;
          total_shares: number | null;
          total_unique_viewers: number | null;
          total_views: number | null;
          trending_score: number | null;
          updated_at: string | null;
        };
        Insert: {
          all_time_score?: number | null;
          avg_completion_rate?: number | null;
          avg_scroll_depth?: number | null;
          avg_view_duration?: unknown | null;
          created_at?: string | null;
          last_trending_at?: string | null;
          peak_daily_views?: number | null;
          peak_date?: string | null;
          recipe_id: string;
          total_likes?: number | null;
          total_saves?: number | null;
          total_shares?: number | null;
          total_unique_viewers?: number | null;
          total_views?: number | null;
          trending_score?: number | null;
          updated_at?: string | null;
        };
        Update: {
          all_time_score?: number | null;
          avg_completion_rate?: number | null;
          avg_scroll_depth?: number | null;
          avg_view_duration?: unknown | null;
          created_at?: string | null;
          last_trending_at?: string | null;
          peak_daily_views?: number | null;
          peak_date?: string | null;
          recipe_id?: string;
          total_likes?: number | null;
          total_saves?: number | null;
          total_shares?: number | null;
          total_unique_viewers?: number | null;
          total_views?: number | null;
          trending_score?: number | null;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_analytics_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: true;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_analytics_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: true;
            referencedRelation: 'v_today_popular_recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_daily_stats: {
        Row: {
          avg_completion_rate: number | null;
          avg_scroll_depth: number | null;
          avg_view_duration: unknown | null;
          bounce_rate: number | null;
          created_at: string | null;
          date: string;
          device_breakdown: Json | null;
          engagement_score: number | null;
          likes_added: number | null;
          likes_removed: number | null;
          recipe_id: string;
          referrer_breakdown: Json | null;
          saves_added: number | null;
          saves_removed: number | null;
          shares: number | null;
          unique_viewers: number | null;
          updated_at: string | null;
          views: number | null;
        };
        Insert: {
          avg_completion_rate?: number | null;
          avg_scroll_depth?: number | null;
          avg_view_duration?: unknown | null;
          bounce_rate?: number | null;
          created_at?: string | null;
          date: string;
          device_breakdown?: Json | null;
          engagement_score?: number | null;
          likes_added?: number | null;
          likes_removed?: number | null;
          recipe_id: string;
          referrer_breakdown?: Json | null;
          saves_added?: number | null;
          saves_removed?: number | null;
          shares?: number | null;
          unique_viewers?: number | null;
          updated_at?: string | null;
          views?: number | null;
        };
        Update: {
          avg_completion_rate?: number | null;
          avg_scroll_depth?: number | null;
          avg_view_duration?: unknown | null;
          bounce_rate?: number | null;
          created_at?: string | null;
          date?: string;
          device_breakdown?: Json | null;
          engagement_score?: number | null;
          likes_added?: number | null;
          likes_removed?: number | null;
          recipe_id?: string;
          referrer_breakdown?: Json | null;
          saves_added?: number | null;
          saves_removed?: number | null;
          shares?: number | null;
          unique_viewers?: number | null;
          updated_at?: string | null;
          views?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_daily_stats_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_daily_stats_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'v_today_popular_recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_interactions: {
        Row: {
          created_at: string | null;
          id: number;
          interaction_data: Json | null;
          interaction_type: string;
          recipe_id: string;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          id?: number;
          interaction_data?: Json | null;
          interaction_type: string;
          recipe_id: string;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          id?: number;
          interaction_data?: Json | null;
          interaction_type?: string;
          recipe_id?: string;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_interactions_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_interactions_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'v_today_popular_recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_interactions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_steps: {
        Row: {
          description: string | null;
          id: number;
          recipe_id: string;
          step_index: number;
          time: number;
          title: string | null;
          total_water: number | null;
          water: number | null;
        };
        Insert: {
          description?: string | null;
          id?: number;
          recipe_id: string;
          step_index: number;
          time: number;
          title?: string | null;
          total_water?: number | null;
          water?: number | null;
        };
        Update: {
          description?: string | null;
          id?: number;
          recipe_id?: string;
          step_index?: number;
          time?: number;
          title?: string | null;
          total_water?: number | null;
          water?: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_steps_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_steps_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'v_today_popular_recipes';
            referencedColumns: ['id'];
          },
        ];
      };
      recipe_views: {
        Row: {
          completion_rate: number | null;
          created_at: string | null;
          device_type: string | null;
          duration_seconds: number | null;
          id: number;
          is_bounce: boolean | null;
          recipe_id: string;
          scroll_depth: number | null;
          session_id: string;
          steps_viewed: number | null;
          total_steps: number | null;
          user_id: string | null;
          view_ended_at: string | null;
          view_started_at: string | null;
        };
        Insert: {
          completion_rate?: number | null;
          created_at?: string | null;
          device_type?: string | null;
          duration_seconds?: number | null;
          id?: number;
          is_bounce?: boolean | null;
          recipe_id: string;
          scroll_depth?: number | null;
          session_id: string;
          steps_viewed?: number | null;
          total_steps?: number | null;
          user_id?: string | null;
          view_ended_at?: string | null;
          view_started_at?: string | null;
        };
        Update: {
          completion_rate?: number | null;
          created_at?: string | null;
          device_type?: string | null;
          duration_seconds?: number | null;
          id?: number;
          is_bounce?: boolean | null;
          recipe_id?: string;
          scroll_depth?: number | null;
          session_id?: string;
          steps_viewed?: number | null;
          total_steps?: number | null;
          user_id?: string | null;
          view_ended_at?: string | null;
          view_started_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recipe_views_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_views_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'v_today_popular_recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'recipe_views_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      recipes: {
        Row: {
          brewing_type: Database['public']['Enums']['brewing_type'] | null;
          coffee: number;
          created_at: string;
          description: string | null;
          dripper: string | null;
          filter: string | null;
          id: string;
          is_public: boolean | null;
          micron: number | null;
          name: string;
          owner_id: string;
          ratio: number | null;
          total_time: number;
          updated_at: string;
          water: number;
          water_temperature: number;
          youtube_url: string | null;
        };
        Insert: {
          brewing_type?: Database['public']['Enums']['brewing_type'] | null;
          coffee: number;
          created_at?: string;
          description?: string | null;
          dripper?: string | null;
          filter?: string | null;
          id?: string;
          is_public?: boolean | null;
          micron?: number | null;
          name: string;
          owner_id: string;
          ratio?: number | null;
          total_time: number;
          updated_at?: string;
          water: number;
          water_temperature: number;
          youtube_url?: string | null;
        };
        Update: {
          brewing_type?: Database['public']['Enums']['brewing_type'] | null;
          coffee?: number;
          created_at?: string;
          description?: string | null;
          dripper?: string | null;
          filter?: string | null;
          id?: string;
          is_public?: boolean | null;
          micron?: number | null;
          name?: string;
          owner_id?: string;
          ratio?: number | null;
          total_time?: number;
          updated_at?: string;
          water?: number;
          water_temperature?: number;
          youtube_url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recipes_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      saved_recipes: {
        Row: {
          is_pinned: boolean | null;
          pin_order: number | null;
          pinned_at: string | null;
          recipe_id: string;
          saved_at: string;
          user_id: string;
        };
        Insert: {
          is_pinned?: boolean | null;
          pin_order?: number | null;
          pinned_at?: string | null;
          recipe_id: string;
          saved_at?: string;
          user_id: string;
        };
        Update: {
          is_pinned?: boolean | null;
          pin_order?: number | null;
          pinned_at?: string | null;
          recipe_id?: string;
          saved_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_recipes_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_recipes_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'v_today_popular_recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_recipes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_activity_logs: {
        Row: {
          created_at: string | null;
          event_data: Json | null;
          event_type: string;
          id: number;
          ip_address: unknown | null;
          path: string;
          recipe_id: string | null;
          referrer: string | null;
          session_id: string;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type: string;
          id?: number;
          ip_address?: unknown | null;
          path: string;
          recipe_id?: string | null;
          referrer?: string | null;
          session_id: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          created_at?: string | null;
          event_data?: Json | null;
          event_type?: string;
          id?: number;
          ip_address?: unknown | null;
          path?: string;
          recipe_id?: string | null;
          referrer?: string | null;
          session_id?: string;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_activity_logs_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activity_logs_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'v_today_popular_recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'user_activity_logs_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      user_sessions: {
        Row: {
          ended_at: string | null;
          id: string;
          ip_address: unknown | null;
          is_active: boolean | null;
          last_activity_at: string | null;
          page_views: number | null;
          started_at: string | null;
          user_agent: string | null;
          user_id: string | null;
        };
        Insert: {
          ended_at?: string | null;
          id?: string;
          ip_address?: unknown | null;
          is_active?: boolean | null;
          last_activity_at?: string | null;
          page_views?: number | null;
          started_at?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Update: {
          ended_at?: string | null;
          id?: string;
          ip_address?: unknown | null;
          is_active?: boolean | null;
          last_activity_at?: string | null;
          page_views?: number | null;
          started_at?: string | null;
          user_agent?: string | null;
          user_id?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'user_sessions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          created_at: string;
          display_name: string;
          email: string;
          id: string;
          profile_image: string | null;
          updated_at: string;
        };
        Insert: {
          created_at?: string;
          display_name: string;
          email: string;
          id: string;
          profile_image?: string | null;
          updated_at?: string;
        };
        Update: {
          created_at?: string;
          display_name?: string;
          email?: string;
          id?: string;
          profile_image?: string | null;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: {
      pinned_recipes_view: {
        Row: {
          coffee: number | null;
          description: string | null;
          dripper: string | null;
          is_public: boolean | null;
          owner_name: string | null;
          pin_order: number | null;
          pinned_at: string | null;
          ratio: number | null;
          recipe_id: string | null;
          recipe_name: string | null;
          total_time: number | null;
          user_id: string | null;
          water: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'saved_recipes_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_recipes_recipe_id_fkey';
            columns: ['recipe_id'];
            isOneToOne: false;
            referencedRelation: 'v_today_popular_recipes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'saved_recipes_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      v_today_popular_recipes: {
        Row: {
          avg_completion_rate: number | null;
          engagement_score: number | null;
          id: string | null;
          name: string | null;
          owner_id: string | null;
          owner_name: string | null;
          unique_viewers: number | null;
          views: number | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recipes_owner_id_fkey';
            columns: ['owner_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      v_user_behavior_patterns: {
        Row: {
          active_users: number | null;
          date: string | null;
          hour: number | null;
          likes: number | null;
          recipe_views: number | null;
          saves: number | null;
        };
        Relationships: [];
      };
      v_weekly_trending_recipes: {
        Row: {
          recent_engagement: number | null;
          recent_views: number | null;
          recipe_id: string | null;
          recipe_name: string | null;
          trending_score: number | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      aggregate_daily_user_stats: {
        Args: { target_date: string };
        Returns: undefined;
      };
      calculate_recipe_engagement_score: {
        Args: {
          p_views: number;
          p_avg_duration: unknown;
          p_completion_rate: number;
          p_likes: number;
          p_saves: number;
          p_shares: number;
        };
        Returns: number;
      };
      calculate_trending_recipes: {
        Args: Record<PropertyKey, never>;
        Returns: {
          recipe_id: string;
          recipe_name: string;
          trending_score: number;
          recent_views: number;
          recent_engagement: number;
        }[];
      };
    };
    Enums: {
      brewing_type: 'hot' | 'ice';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DatabaseWithoutInternals = Omit<Database, '__InternalSupabase'>;

type DefaultSchema = DatabaseWithoutInternals[Extract<
  keyof Database,
  'public'
>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
        DefaultSchema['Views'])
    ? (DefaultSchema['Tables'] &
        DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R;
      }
      ? R
      : never
    : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Insert: infer I;
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I;
      }
      ? I
      : never
    : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema['Tables']
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables']
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
      Update: infer U;
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
    ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U;
      }
      ? U
      : never
    : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema['Enums']
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
    ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
    : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema['CompositeTypes']
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals;
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals;
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
    ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
    : never;

export const Constants = {
  public: {
    Enums: {
      brewing_type: ['hot', 'ice'],
    },
  },
} as const;
