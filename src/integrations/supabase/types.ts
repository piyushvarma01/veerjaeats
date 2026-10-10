export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      categories: {
        Row: {
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_published: boolean
          name: string
          seo_description: string
          seo_title: string
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          name: string
          seo_description?: string
          seo_title?: string
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          name?: string
          seo_description?: string
          seo_title?: string
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      customer_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          message: string
          name: string
          phone: string
          status: Database["public"]["Enums"]["message_status"]
          subject: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          message: string
          name: string
          phone?: string
          status?: Database["public"]["Enums"]["message_status"]
          subject: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          message?: string
          name?: string
          phone?: string
          status?: Database["public"]["Enums"]["message_status"]
          subject?: string
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          address: string
          city: string
          created_at: string
          email: string
          full_name: string
          id: string
          mobile: string
          pin: string
          state: string
          updated_at: string
        }
        Insert: {
          address: string
          city: string
          created_at?: string
          email: string
          full_name: string
          id?: string
          mobile: string
          pin: string
          state: string
          updated_at?: string
        }
        Update: {
          address?: string
          city?: string
          created_at?: string
          email?: string
          full_name?: string
          id?: string
          mobile?: string
          pin?: string
          state?: string
          updated_at?: string
        }
        Relationships: []
      }
      gallery_images: {
        Row: {
          caption: string
          created_at: string
          id: string
          image_url: string
          is_published: boolean
          sort_order: number
          storage_path: string
          updated_at: string
        }
        Insert: {
          caption?: string
          created_at?: string
          id?: string
          image_url: string
          is_published?: boolean
          sort_order?: number
          storage_path: string
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          id?: string
          image_url?: string
          is_published?: boolean
          sort_order?: number
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string
          id: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
          size_id: string
          size_label: string
          unit_cost: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
          size_id: string
          size_label: string
          unit_cost?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          product_name?: string
          quantity?: number
          size_id?: string
          size_label?: string
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          admin_notes: string
          created_at: string
          customer_id: string
          delivery: number
          id: string
          order_number: string
          payment_method: string
          status: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at: string
          user_id: string | null
        }
        Insert: {
          admin_notes?: string
          created_at?: string
          customer_id: string
          delivery?: number
          id?: string
          order_number: string
          payment_method?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal: number
          total: number
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          admin_notes?: string
          created_at?: string
          customer_id?: string
          delivery?: number
          id?: string
          order_number?: string
          payment_method?: string
          status?: Database["public"]["Enums"]["order_status"]
          subtotal?: number
          total?: number
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      product_images: {
        Row: {
          alt_text: string
          created_at: string
          id: string
          image_url: string
          is_primary: boolean
          product_id: string
          sort_order: number
          updated_at: string
          variant_id: string | null
        }
        Insert: {
          alt_text?: string
          created_at?: string
          id?: string
          image_url: string
          is_primary?: boolean
          product_id: string
          sort_order?: number
          updated_at?: string
          variant_id?: string | null
        }
        Update: {
          alt_text?: string
          created_at?: string
          id?: string
          image_url?: string
          is_primary?: boolean
          product_id?: string
          sort_order?: number
          updated_at?: string
          variant_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "product_images_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_images_variant_id_fkey"
            columns: ["variant_id"]
            isOneToOne: false
            referencedRelation: "product_variants"
            referencedColumns: ["id"]
          },
        ]
      }
      product_variants: {
        Row: {
          cost_price: number
          created_at: string
          id: string
          is_active: boolean
          label: string
          mrp: number
          price: number
          product_id: string
          sku: string
          sort_order: number
          stock: number
          updated_at: string
        }
        Insert: {
          cost_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label: string
          mrp: number
          price: number
          product_id: string
          sku: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          cost_price?: number
          created_at?: string
          id?: string
          is_active?: boolean
          label?: string
          mrp?: number
          price?: number
          product_id?: string
          sku?: string
          sort_order?: number
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_variants_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string
          description: string
          id: string
          image_url: string | null
          is_active: boolean
          is_bestseller: boolean
          is_featured: boolean
          is_new_arrival: boolean
          name: string
          seo_description: string
          seo_keywords: string
          seo_title: string
          short_description: string
          short_name: string
          sku: string
          slug: string
          sort_order: number
          tags: string[]
          updated_at: string
          weight: string
        }
        Insert: {
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          name: string
          seo_description?: string
          seo_keywords?: string
          seo_title?: string
          short_description?: string
          short_name: string
          sku?: string
          slug: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
          weight?: string
        }
        Update: {
          category_id?: string | null
          created_at?: string
          description?: string
          id?: string
          image_url?: string | null
          is_active?: boolean
          is_bestseller?: boolean
          is_featured?: boolean
          is_new_arrival?: boolean
          name?: string
          seo_description?: string
          seo_keywords?: string
          seo_title?: string
          short_description?: string
          short_name?: string
          sku?: string
          slug?: string
          sort_order?: number
          tags?: string[]
          updated_at?: string
          weight?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      reels: {
        Row: {
          caption: string
          created_at: string
          id: string
          is_published: boolean
          media_url: string
          sort_order: number
          title: string
          updated_at: string
        }
        Insert: {
          caption?: string
          created_at?: string
          id?: string
          is_published?: boolean
          media_url: string
          sort_order?: number
          title: string
          updated_at?: string
        }
        Update: {
          caption?: string
          created_at?: string
          id?: string
          is_published?: boolean
          media_url?: string
          sort_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      review_media: {
        Row: {
          created_at: string
          id: string
          kind: string
          review_id: string
          sort_order: number
          storage_path: string
        }
        Insert: {
          created_at?: string
          id?: string
          kind: string
          review_id: string
          sort_order?: number
          storage_path: string
        }
        Update: {
          created_at?: string
          id?: string
          kind?: string
          review_id?: string
          sort_order?: number
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_media_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          city: string
          created_at: string
          customer_name: string
          id: string
          order_id: string | null
          product_id: string | null
          rating: number
          review: string
          status: Database["public"]["Enums"]["review_status"]
          updated_at: string
          user_id: string | null
        }
        Insert: {
          city?: string
          created_at?: string
          customer_name: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          rating: number
          review: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          city?: string
          created_at?: string
          customer_name?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          rating?: number
          review?: string
          status?: Database["public"]["Enums"]["review_status"]
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      site_images: {
        Row: {
          alt_text: string
          created_at: string
          image_url: string
          slot: string
          storage_path: string
          updated_at: string
        }
        Insert: {
          alt_text?: string
          created_at?: string
          image_url: string
          slot: string
          storage_path: string
          updated_at?: string
        }
        Update: {
          alt_text?: string
          created_at?: string
          image_url?: string
          slot?: string
          storage_path?: string
          updated_at?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      message_status: "unread" | "read" | "resolved"
      order_status:
        | "new"
        | "confirmed"
        | "packed"
        | "shipped"
        | "delivered"
        | "cancelled"
        | "returned"
      review_status: "pending" | "approved" | "rejected"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      app_role: ["admin", "moderator", "user"],
      message_status: ["unread", "read", "resolved"],
      order_status: [
        "new",
        "confirmed",
        "packed",
        "shipped",
        "delivered",
        "cancelled",
        "returned",
      ],
      review_status: ["pending", "approved", "rejected"],
    },
  },
} as const
