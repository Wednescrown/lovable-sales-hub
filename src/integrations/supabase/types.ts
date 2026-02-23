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
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_log: {
        Row: {
          action: string
          company_id: string | null
          created_at: string
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          company_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      branch_stock: {
        Row: {
          branch_id: string
          company_id: string
          id: string
          product_id: string
          quantity: number
          updated_at: string
        }
        Insert: {
          branch_id: string
          company_id: string
          id?: string
          product_id: string
          quantity?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string
          company_id?: string
          id?: string
          product_id?: string
          quantity?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "branch_stock_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "branch_stock_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      branches: {
        Row: {
          address: string | null
          company_id: string
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          manager_id: string | null
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          manager_id?: string | null
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          company_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      companies: {
        Row: {
          address: string | null
          created_at: string
          email: string
          id: string
          is_active: boolean
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email: string
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      company_subscriptions: {
        Row: {
          cancelled_at: string | null
          company_id: string
          created_at: string
          expires_at: string | null
          id: string
          notes: string | null
          plan_id: string
          starts_at: string
          status: Database["public"]["Enums"]["subscription_status"]
          suspended_at: string | null
          updated_at: string
        }
        Insert: {
          cancelled_at?: string | null
          company_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          plan_id: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          suspended_at?: string | null
          updated_at?: string
        }
        Update: {
          cancelled_at?: string | null
          company_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          notes?: string | null
          plan_id?: string
          starts_at?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          suspended_at?: string | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "company_subscriptions_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: true
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "company_subscriptions_plan_id_fkey"
            columns: ["plan_id"]
            isOneToOne: false
            referencedRelation: "subscription_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_role_permissions: {
        Row: {
          can_access: boolean
          custom_role_id: string
          id: string
          module: string
        }
        Insert: {
          can_access?: boolean
          custom_role_id: string
          id?: string
          module: string
        }
        Update: {
          can_access?: boolean
          custom_role_id?: string
          id?: string
          module?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_role_permissions_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          company_id: string
          created_at: string
          description: string | null
          id: string
          label: string
          name: string
          updated_at: string
        }
        Insert: {
          company_id: string
          created_at?: string
          description?: string | null
          id?: string
          label: string
          name: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          created_at?: string
          description?: string | null
          id?: string
          label?: string
          name?: string
          updated_at?: string
        }
        Relationships: []
      }
      goods_received_notes: {
        Row: {
          branch_id: string | null
          company_id: string
          created_at: string
          grn_number: string
          id: string
          notes: string | null
          purchase_order_id: string | null
          received_at: string
          received_by: string | null
          status: Database["public"]["Enums"]["grn_status"]
          supplier_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          company_id: string
          created_at?: string
          grn_number: string
          id?: string
          notes?: string | null
          purchase_order_id?: string | null
          received_at?: string
          received_by?: string | null
          status?: Database["public"]["Enums"]["grn_status"]
          supplier_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          company_id?: string
          created_at?: string
          grn_number?: string
          id?: string
          notes?: string | null
          purchase_order_id?: string | null
          received_at?: string
          received_by?: string | null
          status?: Database["public"]["Enums"]["grn_status"]
          supplier_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "goods_received_notes_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_received_notes_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "goods_received_notes_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      grn_items: {
        Row: {
          grn_id: string
          id: string
          product_name: string
          quantity_received: number
          sku: string | null
          total_cost: number
          unit_cost: number
        }
        Insert: {
          grn_id: string
          id?: string
          product_name: string
          quantity_received?: number
          sku?: string | null
          total_cost?: number
          unit_cost?: number
        }
        Update: {
          grn_id?: string
          id?: string
          product_name?: string
          quantity_received?: number
          sku?: string | null
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "grn_items_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "goods_received_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      grn_return_items: {
        Row: {
          grn_item_id: string
          grn_return_id: string
          id: string
          quantity_returned: number
          total_cost: number
          unit_cost: number
        }
        Insert: {
          grn_item_id: string
          grn_return_id: string
          id?: string
          quantity_returned?: number
          total_cost?: number
          unit_cost?: number
        }
        Update: {
          grn_item_id?: string
          grn_return_id?: string
          id?: string
          quantity_returned?: number
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "grn_return_items_grn_item_id_fkey"
            columns: ["grn_item_id"]
            isOneToOne: false
            referencedRelation: "grn_items"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "grn_return_items_grn_return_id_fkey"
            columns: ["grn_return_id"]
            isOneToOne: false
            referencedRelation: "grn_returns"
            referencedColumns: ["id"]
          },
        ]
      }
      grn_returns: {
        Row: {
          company_id: string
          created_at: string
          grn_id: string
          id: string
          reason: string | null
          return_number: string
          returned_at: string
          returned_by: string | null
          total_amount: number
        }
        Insert: {
          company_id: string
          created_at?: string
          grn_id: string
          id?: string
          reason?: string | null
          return_number: string
          returned_at?: string
          returned_by?: string | null
          total_amount?: number
        }
        Update: {
          company_id?: string
          created_at?: string
          grn_id?: string
          id?: string
          reason?: string | null
          return_number?: string
          returned_at?: string
          returned_by?: string | null
          total_amount?: number
        }
        Relationships: [
          {
            foreignKeyName: "grn_returns_grn_id_fkey"
            columns: ["grn_id"]
            isOneToOne: false
            referencedRelation: "goods_received_notes"
            referencedColumns: ["id"]
          },
        ]
      }
      module_permissions: {
        Row: {
          can_access: boolean
          id: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Insert: {
          can_access?: boolean
          id?: string
          module: string
          role: Database["public"]["Enums"]["app_role"]
        }
        Update: {
          can_access?: boolean
          id?: string
          module?: string
          role?: Database["public"]["Enums"]["app_role"]
        }
        Relationships: []
      }
      platform_admins: {
        Row: {
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          barcode: string | null
          category_id: string | null
          company_id: string
          cost_price: number
          created_at: string
          id: string
          min_stock: number
          name: string
          pack_size: number
          sell_price: number
          sku: string
          status: string
          stock: number
          subcategory_id: string | null
          unit: string
          updated_at: string
        }
        Insert: {
          barcode?: string | null
          category_id?: string | null
          company_id: string
          cost_price?: number
          created_at?: string
          id?: string
          min_stock?: number
          name: string
          pack_size?: number
          sell_price?: number
          sku: string
          status?: string
          stock?: number
          subcategory_id?: string | null
          unit?: string
          updated_at?: string
        }
        Update: {
          barcode?: string | null
          category_id?: string | null
          company_id?: string
          cost_price?: number
          created_at?: string
          id?: string
          min_stock?: number
          name?: string
          pack_size?: number
          sell_price?: number
          sku?: string
          status?: string
          stock?: number
          subcategory_id?: string | null
          unit?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_subcategory_id_fkey"
            columns: ["subcategory_id"]
            isOneToOne: false
            referencedRelation: "subcategories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          branch_id: string | null
          company_id: string | null
          created_at: string
          display_name: string | null
          full_name: string
          id: string
          is_active: boolean
          phone: string | null
          pin: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          display_name?: string | null
          full_name: string
          id?: string
          is_active?: boolean
          phone?: string | null
          pin?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          branch_id?: string | null
          company_id?: string | null
          created_at?: string
          display_name?: string | null
          full_name?: string
          id?: string
          is_active?: boolean
          phone?: string | null
          pin?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "profiles_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "profiles_company_id_fkey"
            columns: ["company_id"]
            isOneToOne: false
            referencedRelation: "companies"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_order_items: {
        Row: {
          id: string
          product_name: string
          purchase_order_id: string
          quantity_ordered: number
          quantity_received: number
          sku: string | null
          total_cost: number
          unit_cost: number
        }
        Insert: {
          id?: string
          product_name: string
          purchase_order_id: string
          quantity_ordered?: number
          quantity_received?: number
          sku?: string | null
          total_cost?: number
          unit_cost?: number
        }
        Update: {
          id?: string
          product_name?: string
          purchase_order_id?: string
          quantity_ordered?: number
          quantity_received?: number
          sku?: string | null
          total_cost?: number
          unit_cost?: number
        }
        Relationships: [
          {
            foreignKeyName: "purchase_order_items_purchase_order_id_fkey"
            columns: ["purchase_order_id"]
            isOneToOne: false
            referencedRelation: "purchase_orders"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_orders: {
        Row: {
          branch_id: string | null
          company_id: string
          created_at: string
          created_by: string | null
          expected_date: string | null
          id: string
          notes: string | null
          order_number: string
          status: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id: string
          total_amount: number
          updated_at: string
        }
        Insert: {
          branch_id?: string | null
          company_id: string
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_number: string
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id: string
          total_amount?: number
          updated_at?: string
        }
        Update: {
          branch_id?: string | null
          company_id?: string
          created_at?: string
          created_by?: string | null
          expected_date?: string | null
          id?: string
          notes?: string | null
          order_number?: string
          status?: Database["public"]["Enums"]["purchase_order_status"]
          supplier_id?: string
          total_amount?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "purchase_orders_branch_id_fkey"
            columns: ["branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "purchase_orders_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfer_items: {
        Row: {
          id: string
          product_id: string
          quantity: number
          transfer_id: string
        }
        Insert: {
          id?: string
          product_id: string
          quantity?: number
          transfer_id: string
        }
        Update: {
          id?: string
          product_id?: string
          quantity?: number
          transfer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfer_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfer_items_transfer_id_fkey"
            columns: ["transfer_id"]
            isOneToOne: false
            referencedRelation: "stock_transfers"
            referencedColumns: ["id"]
          },
        ]
      }
      stock_transfers: {
        Row: {
          company_id: string
          completed_at: string | null
          created_at: string
          created_by: string | null
          from_branch_id: string
          id: string
          notes: string | null
          status: string
          to_branch_id: string
          transfer_number: string
          updated_at: string
        }
        Insert: {
          company_id: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          from_branch_id: string
          id?: string
          notes?: string | null
          status?: string
          to_branch_id: string
          transfer_number: string
          updated_at?: string
        }
        Update: {
          company_id?: string
          completed_at?: string | null
          created_at?: string
          created_by?: string | null
          from_branch_id?: string
          id?: string
          notes?: string | null
          status?: string
          to_branch_id?: string
          transfer_number?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "stock_transfers_from_branch_id_fkey"
            columns: ["from_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "stock_transfers_to_branch_id_fkey"
            columns: ["to_branch_id"]
            isOneToOne: false
            referencedRelation: "branches"
            referencedColumns: ["id"]
          },
        ]
      }
      subcategories: {
        Row: {
          category_id: string
          company_id: string
          created_at: string
          id: string
          name: string
          updated_at: string
        }
        Insert: {
          category_id: string
          company_id: string
          created_at?: string
          id?: string
          name: string
          updated_at?: string
        }
        Update: {
          category_id?: string
          company_id?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "subcategories_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_plans: {
        Row: {
          created_at: string
          description: string | null
          features: Json | null
          id: string
          interval: Database["public"]["Enums"]["plan_interval"]
          is_active: boolean
          max_branches: number
          max_products: number
          max_users: number
          name: string
          price: number
          sort_order: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval?: Database["public"]["Enums"]["plan_interval"]
          is_active?: boolean
          max_branches?: number
          max_products?: number
          max_users?: number
          name: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          features?: Json | null
          id?: string
          interval?: Database["public"]["Enums"]["plan_interval"]
          is_active?: boolean
          max_branches?: number
          max_products?: number
          max_users?: number
          name?: string
          price?: number
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      suppliers: {
        Row: {
          address: string | null
          company_id: string
          contact_person: string | null
          created_at: string
          email: string | null
          id: string
          is_active: boolean
          name: string
          phone: string | null
          tax_id: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          company_id: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          company_id?: string
          contact_person?: string | null
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean
          name?: string
          phone?: string | null
          tax_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      user_custom_roles: {
        Row: {
          created_at: string
          custom_role_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          custom_role_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          custom_role_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_custom_roles_custom_role_id_fkey"
            columns: ["custom_role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
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
          role?: Database["public"]["Enums"]["app_role"]
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
      can_return_grn: {
        Args: { _grn_id: string; _user_id: string }
        Returns: boolean
      }
      check_has_pin: { Args: { _profile_id: string }; Returns: boolean }
      generate_next_grn_number: {
        Args: { _company_id: string }
        Returns: string
      }
      generate_next_order_number: {
        Args: { _company_id: string }
        Returns: string
      }
      generate_next_return_number: {
        Args: { _company_id: string }
        Returns: string
      }
      generate_next_transfer_number: {
        Args: { _company_id: string }
        Returns: string
      }
      generate_product_sku: {
        Args: { _company_id: string; _product_name: string }
        Returns: string
      }
      get_user_company_id: { Args: { _user_id: string }; Returns: string }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_platform_admin: { Args: { _user_id: string }; Returns: boolean }
      register_company: {
        Args: {
          _company_email: string
          _company_name: string
          _company_phone?: string
          _user_id: string
        }
        Returns: string
      }
      reset_user_pin: { Args: { _profile_id: string }; Returns: undefined }
      set_user_pin: {
        Args: { _pin: string; _profile_id: string }
        Returns: undefined
      }
      validate_user_pin: {
        Args: { _pin: string; _profile_id: string }
        Returns: boolean
      }
    }
    Enums: {
      app_role: "admin" | "gestor" | "caixeiro" | "gestor_stock"
      grn_status: "received" | "returned" | "corrected"
      plan_interval: "monthly" | "yearly"
      purchase_order_status:
        | "draft"
        | "sent"
        | "partial"
        | "received"
        | "cancelled"
      subscription_status:
        | "active"
        | "suspended"
        | "cancelled"
        | "expired"
        | "trial"
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
  public: {
    Enums: {
      app_role: ["admin", "gestor", "caixeiro", "gestor_stock"],
      grn_status: ["received", "returned", "corrected"],
      plan_interval: ["monthly", "yearly"],
      purchase_order_status: [
        "draft",
        "sent",
        "partial",
        "received",
        "cancelled",
      ],
      subscription_status: [
        "active",
        "suspended",
        "cancelled",
        "expired",
        "trial",
      ],
    },
  },
} as const
