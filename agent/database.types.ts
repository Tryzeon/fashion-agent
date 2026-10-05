export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          extensions?: Json
          operationName?: string
          query?: string
          variables?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
      product_categories: {
        Row: {
          code: string
          created_at: string
          default_garment_type: Database["public"]["Enums"]["garment_type"]
          gender: Database["public"]["Enums"]["product_gender"]
          id: string
          image_female: string | null
          image_male: string | null
          name: string
          order: number
        }
        Insert: {
          code: string
          created_at?: string
          default_garment_type: Database["public"]["Enums"]["garment_type"]
          gender?: Database["public"]["Enums"]["product_gender"]
          id?: string
          image_female?: string | null
          image_male?: string | null
          name: string
          order?: number
        }
        Update: {
          code?: string
          created_at?: string
          default_garment_type?: Database["public"]["Enums"]["garment_type"]
          gender?: Database["public"]["Enums"]["product_gender"]
          id?: string
          image_female?: string | null
          image_male?: string | null
          name?: string
          order?: number
        }
        Relationships: []
      }
      product_sizes: {
        Row: {
          body_measurement_ranges: Json | null
          created_at: string
          garment_measurements: Json | null
          id: string
          name: string
          product_id: string
          updated_at: string
        }
        Insert: {
          body_measurement_ranges?: Json | null
          created_at?: string
          garment_measurements?: Json | null
          id?: string
          name: string
          product_id: string
          updated_at?: string
        }
        Update: {
          body_measurement_ranges?: Json | null
          created_at?: string
          garment_measurements?: Json | null
          id?: string
          name?: string
          product_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_sizes_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string
          created_at: string
          description: string | null
          elasticity: Database["public"]["Enums"]["product_elasticity"] | null
          fit: Database["public"]["Enums"]["product_fit"] | null
          garment_type: Database["public"]["Enums"]["garment_type"]
          gender: Database["public"]["Enums"]["product_gender"]
          id: string
          image_paths: string[] | null
          material: string | null
          name: string
          price: number
          purchase_link: string | null
          seasons: Database["public"]["Enums"]["product_season"][] | null
          status: string
          store_id: string
          styles: string[] | null
          thickness: Database["public"]["Enums"]["product_thickness"] | null
          updated_at: string
        }
        Insert: {
          category_id: string
          created_at?: string
          description?: string | null
          elasticity?: Database["public"]["Enums"]["product_elasticity"] | null
          fit?: Database["public"]["Enums"]["product_fit"] | null
          garment_type: Database["public"]["Enums"]["garment_type"]
          gender?: Database["public"]["Enums"]["product_gender"]
          id?: string
          image_paths?: string[] | null
          material?: string | null
          name: string
          price: number
          purchase_link?: string | null
          seasons?: Database["public"]["Enums"]["product_season"][] | null
          status?: string
          store_id: string
          styles?: string[] | null
          thickness?: Database["public"]["Enums"]["product_thickness"] | null
          updated_at?: string
        }
        Update: {
          category_id?: string
          created_at?: string
          description?: string | null
          elasticity?: Database["public"]["Enums"]["product_elasticity"] | null
          fit?: Database["public"]["Enums"]["product_fit"] | null
          garment_type?: Database["public"]["Enums"]["garment_type"]
          gender?: Database["public"]["Enums"]["product_gender"]
          id?: string
          image_paths?: string[] | null
          material?: string | null
          name?: string
          price?: number
          purchase_link?: string | null
          seasons?: Database["public"]["Enums"]["product_season"][] | null
          status?: string
          store_id?: string
          styles?: string[] | null
          thickness?: Database["public"]["Enums"]["product_thickness"] | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_store_id_fkey"
            columns: ["store_id"]
            isOneToOne: false
            referencedRelation: "store_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_profiles: {
        Row: {
          address: string | null
          channels: Database["public"]["Enums"]["store_channel"][]
          created_at: string
          id: string
          latitude: number | null
          logo_path: string | null
          longitude: number | null
          name: string
          order_contacts: Json
          owner_id: string
          slug: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          channels?: Database["public"]["Enums"]["store_channel"][]
          created_at?: string
          id?: string
          latitude?: number | null
          logo_path?: string | null
          longitude?: number | null
          name?: string
          order_contacts?: Json
          owner_id: string
          slug?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          channels?: Database["public"]["Enums"]["store_channel"][]
          created_at?: string
          id?: string
          latitude?: number | null
          logo_path?: string | null
          longitude?: number | null
          name?: string
          order_contacts?: Json
          owner_id?: string
          slug?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_daily_usage: {
        Row: {
          chat_count: number
          tryon_count: number
          usage_date: string
          user_id: string
          video_count: number
        }
        Insert: {
          chat_count?: number
          tryon_count?: number
          usage_date?: string
          user_id: string
          video_count?: number
        }
        Update: {
          chat_count?: number
          tryon_count?: number
          usage_date?: string
          user_id?: string
          video_count?: number
        }
        Relationships: []
      }
      user_profiles: {
        Row: {
          age_range: string | null
          avatar_path: string | null
          created_at: string
          email: string | null
          gender: Database["public"]["Enums"]["user_gender"] | null
          is_onboarded: boolean
          measurements: Json | null
          name: string
          style_preferences: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          age_range?: string | null
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          gender?: Database["public"]["Enums"]["user_gender"] | null
          is_onboarded?: boolean
          measurements?: Json | null
          name: string
          style_preferences?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          age_range?: string | null
          avatar_path?: string | null
          created_at?: string
          email?: string | null
          gender?: Database["public"]["Enums"]["user_gender"] | null
          is_onboarded?: boolean
          measurements?: Json | null
          name?: string
          style_preferences?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      wardrobe_items: {
        Row: {
          created_at: string
          garment_type: Database["public"]["Enums"]["garment_type"]
          id: string
          image_path: string
          tags: string[] | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          garment_type: Database["public"]["Enums"]["garment_type"]
          id?: string
          image_path: string
          tags?: string[] | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          garment_type?: Database["public"]["Enums"]["garment_type"]
          id?: string
          image_path?: string
          tags?: string[] | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      decrement_feature_usage: {
        Args: { p_feature_name: string; p_user_id: string }
        Returns: boolean
      }
      increment_feature_usage: {
        Args: { p_feature_name: string; p_user_id: string }
        Returns: Json
      }
      list_shop_products: {
        Args: {
          p_category_ids?: string[]
          p_channels?: Database["public"]["Enums"]["store_channel"][]
          p_elasticities?: Database["public"]["Enums"]["product_elasticity"][]
          p_fits?: Database["public"]["Enums"]["product_fit"][]
          p_gender?: Database["public"]["Enums"]["product_gender"]
          p_limit?: number
          p_materials?: string[]
          p_max_price?: number
          p_min_price?: number
          p_offset?: number
          p_search_query?: string
          p_seasons?: Database["public"]["Enums"]["product_season"][]
          p_sort_ascending?: boolean
          p_sort_column?: string
          p_store_id?: string
          p_styles?: string[]
          p_thicknesses?: Database["public"]["Enums"]["product_thickness"][]
          p_user_lat?: number
          p_user_lng?: number
        }
        Returns: Json[]
      }
    }
    Enums: {
      analytics_event_type: "view" | "try_on" | "purchase_click"
      garment_type:
        | "top"
        | "outerwear"
        | "pants"
        | "skirt"
        | "one_piece"
        | "others"
      product_elasticity: "none" | "low" | "medium" | "high"
      product_fit: "slim" | "regular" | "loose" | "oversize"
      product_gender: "male" | "female" | "unisex"
      product_season: "spring" | "summer" | "autumn" | "winter"
      product_thickness: "low" | "medium" | "high"
      store_channel: "physical" | "online"
      user_gender: "female" | "male"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  graphql_public: {
    Enums: {},
  },
  public: {
    Enums: {
      analytics_event_type: ["view", "try_on", "purchase_click"],
      garment_type: [
        "top",
        "outerwear",
        "pants",
        "skirt",
        "one_piece",
        "others",
      ],
      product_elasticity: ["none", "low", "medium", "high"],
      product_fit: ["slim", "regular", "loose", "oversize"],
      product_gender: ["male", "female", "unisex"],
      product_season: ["spring", "summer", "autumn", "winter"],
      product_thickness: ["low", "medium", "high"],
      store_channel: ["physical", "online"],
      user_gender: ["female", "male"],
    },
  },
} as const

