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
      bulk_discount_tiers: {
        Row: {
          created_at: string
          discount_pct: number
          id: string
          scenario_id: string
          sort_order: number
          tcv_threshold: number
          tier_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          discount_pct?: number
          id?: string
          scenario_id: string
          sort_order?: number
          tcv_threshold?: number
          tier_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          discount_pct?: number
          id?: string
          scenario_id?: string
          sort_order?: number
          tcv_threshold?: number
          tier_name?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bulk_discount_tiers_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_items: {
        Row: {
          area: string
          commercial_impact: string | null
          created_at: string
          decision_needed: string | null
          description: string | null
          id: string
          order_form_inclusion: string
          owner: string | null
          status: string
          target_decision_date: string | null
          technical_impact: string | null
          title: string
          updated_at: string
        }
        Insert: {
          area: string
          commercial_impact?: string | null
          created_at?: string
          decision_needed?: string | null
          description?: string | null
          id?: string
          order_form_inclusion?: string
          owner?: string | null
          status?: string
          target_decision_date?: string | null
          technical_impact?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          area?: string
          commercial_impact?: string | null
          created_at?: string
          decision_needed?: string | null
          description?: string | null
          id?: string
          order_form_inclusion?: string
          owner?: string | null
          status?: string
          target_decision_date?: string | null
          technical_impact?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      import_batches: {
        Row: {
          created_at: string
          created_by: string | null
          file_name: string
          id: string
          mapping: Json
          row_count: number
          scenario_id: string | null
          status: string
          tab_names: string[]
          updated_at: string
          validation: Json
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          file_name: string
          id?: string
          mapping?: Json
          row_count?: number
          scenario_id?: string | null
          status?: string
          tab_names?: string[]
          updated_at?: string
          validation?: Json
        }
        Update: {
          created_at?: string
          created_by?: string | null
          file_name?: string
          id?: string
          mapping?: Json
          row_count?: number
          scenario_id?: string | null
          status?: string
          tab_names?: string[]
          updated_at?: string
          validation?: Json
        }
        Relationships: [
          {
            foreignKeyName: "import_batches_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      login_audit_log: {
        Row: {
          email: string
          id: string
          ip_address: string | null
          location: string | null
          logged_in_at: string
          metadata: Json
          user_agent: string | null
          user_id: string
        }
        Insert: {
          email: string
          id?: string
          ip_address?: string | null
          location?: string | null
          logged_in_at?: string
          metadata?: Json
          user_agent?: string | null
          user_id: string
        }
        Update: {
          email?: string
          id?: string
          ip_address?: string | null
          location?: string | null
          logged_in_at?: string
          metadata?: Json
          user_agent?: string | null
          user_id?: string
        }
        Relationships: []
      }
      order_form_lines: {
        Row: {
          created_at: string
          id: string
          order_form_id: string
          sku_line_id: string | null
          sort_order: number
        }
        Insert: {
          created_at?: string
          id?: string
          order_form_id: string
          sku_line_id?: string | null
          sort_order?: number
        }
        Update: {
          created_at?: string
          id?: string
          order_form_id?: string
          sku_line_id?: string | null
          sort_order?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_form_lines_order_form_id_fkey"
            columns: ["order_form_id"]
            isOneToOne: false
            referencedRelation: "order_forms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_form_lines_sku_line_id_fkey"
            columns: ["sku_line_id"]
            isOneToOne: false
            referencedRelation: "sku_lines"
            referencedColumns: ["id"]
          },
        ]
      }
      order_forms: {
        Row: {
          approval_status: string
          assumptions: string | null
          billing_frequency: string
          contract_end: string | null
          contract_start: string | null
          created_at: string
          currency: string
          customer_name: string
          form_number: string | null
          form_type: string
          id: string
          notes: string | null
          open_items: string | null
          partner_name: string
          scenario_id: string
          updated_at: string
        }
        Insert: {
          approval_status?: string
          assumptions?: string | null
          billing_frequency?: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          currency?: string
          customer_name?: string
          form_number?: string | null
          form_type: string
          id?: string
          notes?: string | null
          open_items?: string | null
          partner_name?: string
          scenario_id: string
          updated_at?: string
        }
        Update: {
          approval_status?: string
          assumptions?: string | null
          billing_frequency?: string
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          currency?: string
          customer_name?: string
          form_number?: string | null
          form_type?: string
          id?: string
          notes?: string | null
          open_items?: string | null
          partner_name?: string
          scenario_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_forms_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          created_at: string
          display_name: string | null
          email: string
          id: string
          job_title: string | null
          organisation: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          display_name?: string | null
          email: string
          id: string
          job_title?: string | null
          organisation?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          display_name?: string | null
          email?: string
          id?: string
          job_title?: string | null
          organisation?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      risk_log: {
        Row: {
          category: string
          commercial_impact: string | null
          created_at: string
          decision_needed_by: string | null
          description: string
          id: string
          impact: string
          legal_impact: string | null
          notes: string | null
          owner: string | null
          probability: string
          ref_code: string | null
          status: string
          technical_impact: string | null
          updated_at: string
        }
        Insert: {
          category: string
          commercial_impact?: string | null
          created_at?: string
          decision_needed_by?: string | null
          description: string
          id?: string
          impact?: string
          legal_impact?: string | null
          notes?: string | null
          owner?: string | null
          probability?: string
          ref_code?: string | null
          status?: string
          technical_impact?: string | null
          updated_at?: string
        }
        Update: {
          category?: string
          commercial_impact?: string | null
          created_at?: string
          decision_needed_by?: string | null
          description?: string
          id?: string
          impact?: string
          legal_impact?: string | null
          notes?: string | null
          owner?: string | null
          probability?: string
          ref_code?: string | null
          status?: string
          technical_impact?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      scenario_models: {
        Row: {
          config: Json
          created_at: string
          id: string
          model_key: string
          scenario_id: string
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          id?: string
          model_key: string
          scenario_id: string
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          id?: string
          model_key?: string
          scenario_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "scenario_models_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      scenarios: {
        Row: {
          approval_threshold_pct: number
          bulk_discount_mode: string
          bulk_discount_pct: number
          contract_end: string | null
          contract_start: string | null
          created_at: string
          currency: string
          description: string | null
          id: string
          is_baseline: boolean
          is_locked: boolean
          is_recommended: boolean
          name: string
          notes: string | null
          owner_id: string | null
          owner_name: string | null
          scenario_discount_pct: number
          sort_order: number
          status: string
          strategic_override_pct: number
          updated_at: string
        }
        Insert: {
          approval_threshold_pct?: number
          bulk_discount_mode?: string
          bulk_discount_pct?: number
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_baseline?: boolean
          is_locked?: boolean
          is_recommended?: boolean
          name: string
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          scenario_discount_pct?: number
          sort_order?: number
          status?: string
          strategic_override_pct?: number
          updated_at?: string
        }
        Update: {
          approval_threshold_pct?: number
          bulk_discount_mode?: string
          bulk_discount_pct?: number
          contract_end?: string | null
          contract_start?: string | null
          created_at?: string
          currency?: string
          description?: string | null
          id?: string
          is_baseline?: boolean
          is_locked?: boolean
          is_recommended?: boolean
          name?: string
          notes?: string | null
          owner_id?: string | null
          owner_name?: string | null
          scenario_discount_pct?: number
          sort_order?: number
          status?: string
          strategic_override_pct?: number
          updated_at?: string
        }
        Relationships: []
      }
      sku_lines: {
        Row: {
          approval_status: string
          approval_threshold_pct: number
          assumption_owner: string | null
          billing_frequency: string
          bom_type: string
          bulk_eligible: boolean
          category_discount_pct: number
          classification: string
          cloud: string | null
          coterm_date: string | null
          created_at: string
          description: string | null
          discount_reason: string | null
          discountable: boolean
          end_date: string | null
          id: string
          line_discount_pct: number
          max_discount_pct: number
          needs_salesforce_confirmation: boolean
          needs_sn_confirmation: boolean
          notes: string | null
          product_category: string | null
          product_family: string | null
          proration_method: string
          quantity: number
          scenario_id: string
          sku_code: string | null
          sku_name: string
          source_file: string | null
          source_tab: string | null
          start_date: string | null
          tower_key: string | null
          unit_list_price: number
          unit_of_measure: string
          updated_at: string
          year1_qty: number | null
          year2_qty: number | null
          year3_qty: number | null
        }
        Insert: {
          approval_status?: string
          approval_threshold_pct?: number
          assumption_owner?: string | null
          billing_frequency?: string
          bom_type?: string
          bulk_eligible?: boolean
          category_discount_pct?: number
          classification?: string
          cloud?: string | null
          coterm_date?: string | null
          created_at?: string
          description?: string | null
          discount_reason?: string | null
          discountable?: boolean
          end_date?: string | null
          id?: string
          line_discount_pct?: number
          max_discount_pct?: number
          needs_salesforce_confirmation?: boolean
          needs_sn_confirmation?: boolean
          notes?: string | null
          product_category?: string | null
          product_family?: string | null
          proration_method?: string
          quantity?: number
          scenario_id: string
          sku_code?: string | null
          sku_name: string
          source_file?: string | null
          source_tab?: string | null
          start_date?: string | null
          tower_key?: string | null
          unit_list_price?: number
          unit_of_measure?: string
          updated_at?: string
          year1_qty?: number | null
          year2_qty?: number | null
          year3_qty?: number | null
        }
        Update: {
          approval_status?: string
          approval_threshold_pct?: number
          assumption_owner?: string | null
          billing_frequency?: string
          bom_type?: string
          bulk_eligible?: boolean
          category_discount_pct?: number
          classification?: string
          cloud?: string | null
          coterm_date?: string | null
          created_at?: string
          description?: string | null
          discount_reason?: string | null
          discountable?: boolean
          end_date?: string | null
          id?: string
          line_discount_pct?: number
          max_discount_pct?: number
          needs_salesforce_confirmation?: boolean
          needs_sn_confirmation?: boolean
          notes?: string | null
          product_category?: string | null
          product_family?: string | null
          proration_method?: string
          quantity?: number
          scenario_id?: string
          sku_code?: string | null
          sku_name?: string
          source_file?: string | null
          source_tab?: string | null
          start_date?: string | null
          tower_key?: string | null
          unit_list_price?: number
          unit_of_measure?: string
          updated_at?: string
          year1_qty?: number | null
          year2_qty?: number | null
          year3_qty?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "sku_lines_scenario_id_fkey"
            columns: ["scenario_id"]
            isOneToOne: false
            referencedRelation: "scenarios"
            referencedColumns: ["id"]
          },
        ]
      }
      towers: {
        Row: {
          confidence: string
          created_at: string
          decision_status: string
          description: string | null
          id: string
          key: string
          name: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          confidence?: string
          created_at?: string
          decision_status?: string
          description?: string | null
          id?: string
          key: string
          name: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          confidence?: string
          created_at?: string
          decision_status?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          sort_order?: number
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
      can_edit_deal: { Args: never; Returns: boolean }
      current_user_email: { Args: never; Returns: string }
      ensure_login_report_admin: { Args: never; Returns: boolean }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_deal_architect: { Args: never; Returns: boolean }
      is_techmahindra_user: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role:
        | "login_report_admin"
        | "deal_architect"
        | "salesforce_ae"
        | "tm_osp_lead"
        | "sn_reviewer"
        | "finance_reviewer"
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
      app_role: [
        "login_report_admin",
        "deal_architect",
        "salesforce_ae",
        "tm_osp_lead",
        "sn_reviewer",
        "finance_reviewer",
      ],
    },
  },
} as const
