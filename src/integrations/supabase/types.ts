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
      cash_logs: {
        Row: {
          amount: number
          created_at: string
          description: string | null
          id: string
          organization_id: string
          type: Database["public"]["Enums"]["cash_log_type"]
          user_id: string | null
          user_name: string | null
        }
        Insert: {
          amount: number
          created_at?: string
          description?: string | null
          id?: string
          organization_id: string
          type: Database["public"]["Enums"]["cash_log_type"]
          user_id?: string | null
          user_name?: string | null
        }
        Update: {
          amount?: number
          created_at?: string
          description?: string | null
          id?: string
          organization_id?: string
          type?: Database["public"]["Enums"]["cash_log_type"]
          user_id?: string | null
          user_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "cash_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      custom_roles: {
        Row: {
          created_at: string
          default_role_type:
            | Database["public"]["Enums"]["default_role_type"]
            | null
          description: string | null
          id: string
          is_system_role: boolean | null
          name: string
          organization_id: string
        }
        Insert: {
          created_at?: string
          default_role_type?:
            | Database["public"]["Enums"]["default_role_type"]
            | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name: string
          organization_id: string
        }
        Update: {
          created_at?: string
          default_role_type?:
            | Database["public"]["Enums"]["default_role_type"]
            | null
          description?: string | null
          id?: string
          is_system_role?: boolean | null
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "custom_roles_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_members: {
        Row: {
          display_name: string
          email: string
          id: string
          invited_by: string | null
          is_active: boolean | null
          joined_at: string
          organization_id: string
          role_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          display_name: string
          email: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string
          organization_id: string
          role_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          display_name?: string
          email?: string
          id?: string
          invited_by?: string | null
          is_active?: boolean | null
          joined_at?: string
          organization_id?: string
          role_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_members_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "organization_members_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          logo_url: string | null
          name: string
          subdomain: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name: string
          subdomain: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          logo_url?: string | null
          name?: string
          subdomain?: string
          updated_at?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category: string | null
          created_at: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean | null
          name: string
          organization_id: string
          price: number
          sku: string | null
          stock: number
          updated_at: string
        }
        Insert: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name: string
          organization_id: string
          price?: number
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Update: {
          category?: string | null
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean | null
          name?: string
          organization_id?: string
          price?: number
          sku?: string | null
          stock?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "products_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      role_permissions: {
        Row: {
          created_at: string
          id: string
          permission: Database["public"]["Enums"]["permission_type"]
          role_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          permission: Database["public"]["Enums"]["permission_type"]
          role_id: string
        }
        Update: {
          created_at?: string
          id?: string
          permission?: Database["public"]["Enums"]["permission_type"]
          role_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "role_permissions_role_id_fkey"
            columns: ["role_id"]
            isOneToOne: false
            referencedRelation: "custom_roles"
            referencedColumns: ["id"]
          },
        ]
      }
      store_settings: {
        Row: {
          created_at: string
          currency: string | null
          gst_number: string | null
          id: string
          organization_id: string
          receipt_footer: string | null
          store_address: string | null
          store_name: string
          store_phone: string | null
          tax_rate: number | null
          updated_at: string
          upi_id: string | null
        }
        Insert: {
          created_at?: string
          currency?: string | null
          gst_number?: string | null
          id?: string
          organization_id: string
          receipt_footer?: string | null
          store_address?: string | null
          store_name?: string
          store_phone?: string | null
          tax_rate?: number | null
          updated_at?: string
          upi_id?: string | null
        }
        Update: {
          created_at?: string
          currency?: string | null
          gst_number?: string | null
          id?: string
          organization_id?: string
          receipt_footer?: string | null
          store_address?: string | null
          store_name?: string
          store_phone?: string | null
          tax_rate?: number | null
          updated_at?: string
          upi_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "store_settings_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          cashier_id: string | null
          cashier_name: string | null
          created_at: string
          customer_name: string | null
          customer_phone: string | null
          discount: number
          id: string
          invoice_no: string
          items: Json
          notes: string | null
          organization_id: string
          payment_method: Database["public"]["Enums"]["payment_method"]
          status: Database["public"]["Enums"]["transaction_status"]
          subtotal: number
          tax: number
          total: number
        }
        Insert: {
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          invoice_no: string
          items?: Json
          notes?: string | null
          organization_id: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["transaction_status"]
          subtotal?: number
          tax?: number
          total?: number
        }
        Update: {
          cashier_id?: string | null
          cashier_name?: string | null
          created_at?: string
          customer_name?: string | null
          customer_phone?: string | null
          discount?: number
          id?: string
          invoice_no?: string
          items?: Json
          notes?: string | null
          organization_id?: string
          payment_method?: Database["public"]["Enums"]["payment_method"]
          status?: Database["public"]["Enums"]["transaction_status"]
          subtotal?: number
          tax?: number
          total?: number
        }
        Relationships: [
          {
            foreignKeyName: "transactions_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_organization: {
        Args: {
          _name: string
          _owner_email: string
          _owner_name: string
          _subdomain: string
        }
        Returns: string
      }
      generate_invoice_no: { Args: { _org_id: string }; Returns: string }
      get_user_role_in_org: { Args: { _org_id: string }; Returns: string }
      has_org_permission: {
        Args: {
          _org_id: string
          _permission: Database["public"]["Enums"]["permission_type"]
        }
        Returns: boolean
      }
      is_org_member: { Args: { _org_id: string }; Returns: boolean }
      is_org_owner: { Args: { _org_id: string }; Returns: boolean }
    }
    Enums: {
      cash_log_type: "in" | "out"
      default_role_type: "owner" | "admin" | "cashier"
      payment_method: "cash" | "upi" | "card"
      permission_type:
        | "manage_organization"
        | "manage_users"
        | "manage_roles"
        | "manage_products"
        | "manage_transactions"
        | "manage_cash"
        | "manage_settings"
        | "view_reports"
        | "create_bills"
      transaction_status: "completed" | "pending" | "cancelled"
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
      cash_log_type: ["in", "out"],
      default_role_type: ["owner", "admin", "cashier"],
      payment_method: ["cash", "upi", "card"],
      permission_type: [
        "manage_organization",
        "manage_users",
        "manage_roles",
        "manage_products",
        "manage_transactions",
        "manage_cash",
        "manage_settings",
        "view_reports",
        "create_bills",
      ],
      transaction_status: ["completed", "pending", "cancelled"],
    },
  },
} as const
