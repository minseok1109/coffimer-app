export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
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
            foreignKeyName: "likes_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "likes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
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
            foreignKeyName: "recent_views_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "recent_views_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
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
          water: number;
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
            foreignKeyName: "recipe_steps_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          }
        ];
      };
      recipes: {
        Row: {
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
            foreignKeyName: "recipes_owner_id_fkey";
            columns: ["owner_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
        ];
      };
      saved_recipes: {
        Row: {
          recipe_id: string;
          saved_at: string;
          user_id: string;
        };
        Insert: {
          recipe_id: string;
          saved_at?: string;
          user_id: string;
        };
        Update: {
          recipe_id?: string;
          saved_at?: string;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "saved_recipes_recipe_id_fkey";
            columns: ["recipe_id"];
            isOneToOne: false;
            referencedRelation: "recipes";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "saved_recipes_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "users";
            referencedColumns: ["id"];
          }
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
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

// 타입 헬퍼
export type Tables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Row"];

export type InsertTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Insert"];

export type UpdateTables<T extends keyof Database["public"]["Tables"]> =
  Database["public"]["Tables"][T]["Update"];
