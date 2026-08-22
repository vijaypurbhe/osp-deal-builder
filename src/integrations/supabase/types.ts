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
      customers: {
        Row: {
          annual_revenue: number | null
          aws_commitment: number
          aws_customer: boolean
          azure_commitment: number
          brand_primary: string | null
          brand_secondary: string | null
          country: string | null
          created_at: string
          currency: string
          current_salesforce_acv: number
          employee_count: number | null
          gcp_commitment: number
          id: string
          incumbent_vendors: string[]
          industry: string | null
          is_simulation: boolean
          logo_url: string | null
          name: string
          notes: string | null
          region: string | null
          salesforce_customer_since: string | null
          strategic_platforms: string[]
          sub_industry: string | null
          updated_at: string
        }
        Insert: {
          annual_revenue?: number | null
          aws_commitment?: number
          aws_customer?: boolean
          azure_commitment?: number
          brand_primary?: string | null
          brand_secondary?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          current_salesforce_acv?: number
          employee_count?: number | null
          gcp_commitment?: number
          id?: string
          incumbent_vendors?: string[]
          industry?: string | null
          is_simulation?: boolean
          logo_url?: string | null
          name: string
          notes?: string | null
          region?: string | null
          salesforce_customer_since?: string | null
          strategic_platforms?: string[]
          sub_industry?: string | null
          updated_at?: string
        }
        Update: {
          annual_revenue?: number | null
          aws_commitment?: number
          aws_customer?: boolean
          azure_commitment?: number
          brand_primary?: string | null
          brand_secondary?: string | null
          country?: string | null
          created_at?: string
          currency?: string
          current_salesforce_acv?: number
          employee_count?: number | null
          gcp_commitment?: number
          id?: string
          incumbent_vendors?: string[]
          industry?: string | null
          is_simulation?: boolean
          logo_url?: string | null
          name?: string
          notes?: string | null
          region?: string | null
          salesforce_customer_since?: string | null
          strategic_platforms?: string[]
          sub_industry?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deal_templates: {
        Row: {
          config: Json
          created_at: string
          deal_type: string
          description: string | null
          id: string
          is_seed: boolean
          name: string
          sort_order: number
          source_deal_id: string | null
          updated_at: string
        }
        Insert: {
          config?: Json
          created_at?: string
          deal_type?: string
          description?: string | null
          id?: string
          is_seed?: boolean
          name: string
          sort_order?: number
          source_deal_id?: string | null
          updated_at?: string
        }
        Update: {
          config?: Json
          created_at?: string
          deal_type?: string
          description?: string | null
          id?: string
          is_seed?: boolean
          name?: string
          sort_order?: number
          source_deal_id?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      deal_versions: {
        Row: {
          author_id: string | null
          author_name: string | null
          created_at: string
          deal_id: string
          id: string
          label: string
          snapshot: Json
          summary: string | null
          version_no: number
        }
        Insert: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          deal_id: string
          id?: string
          label: string
          snapshot?: Json
          summary?: string | null
          version_no?: number
        }
        Update: {
          author_id?: string | null
          author_name?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          label?: string
          snapshot?: Json
          summary?: string | null
          version_no?: number
        }
        Relationships: [
          {
            foreignKeyName: "deal_versions_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      deals: {
        Row: {
          close_date: string | null
          contract_end: string | null
          contract_start: string | null
          contract_years: number
          created_at: string
          currency: string
          current_salesforce_acv: number
          current_scenario_id: string | null
          customer_id: string | null
          customer_name: string
          deal_type: string
          finance_owner: string | null
          id: string
          is_archived: boolean
          is_simulation: boolean
          min_license_gm_pct: number
          name: string
          notes: string | null
          opportunity_id: string | null
          owner_id: string | null
          owner_name: string | null
          partner_name: string
          region: string | null
          renewal_uplift_pct: number
          salesforce_ae: string | null
          services_gm_target_pct: number
          sort_order: number
          source_deal_id: string | null
          stage: string
          status: string
          techm_account_lead: string | null
          techm_osp_lead: string | null
          updated_at: string
          use_customer_branding: boolean
        }
        Insert: {
          close_date?: string | null
          contract_end?: string | null
          contract_start?: string | null
          contract_years?: number
          created_at?: string
          currency?: string
          current_salesforce_acv?: number
          current_scenario_id?: string | null
          customer_id?: string | null
          customer_name?: string
          deal_type?: string
          finance_owner?: string | null
          id?: string
          is_archived?: boolean
          is_simulation?: boolean
          min_license_gm_pct?: number
          name: string
          notes?: string | null
          opportunity_id?: string | null
          owner_id?: string | null
          owner_name?: string | null
          partner_name?: string
          region?: string | null
          renewal_uplift_pct?: number
          salesforce_ae?: string | null
          services_gm_target_pct?: number
          sort_order?: number
          source_deal_id?: string | null
          stage?: string
          status?: string
          techm_account_lead?: string | null
          techm_osp_lead?: string | null
          updated_at?: string
          use_customer_branding?: boolean
        }
        Update: {
          close_date?: string | null
          contract_end?: string | null
          contract_start?: string | null
          contract_years?: number
          created_at?: string
          currency?: string
          current_salesforce_acv?: number
          current_scenario_id?: string | null
          customer_id?: string | null
          customer_name?: string
          deal_type?: string
          finance_owner?: string | null
          id?: string
          is_archived?: boolean
          is_simulation?: boolean
          min_license_gm_pct?: number
          name?: string
          notes?: string | null
          opportunity_id?: string | null
          owner_id?: string | null
          owner_name?: string | null
          partner_name?: string
          region?: string | null
          renewal_uplift_pct?: number
          salesforce_ae?: string | null
          services_gm_target_pct?: number
          sort_order?: number
          source_deal_id?: string | null
          stage?: string
          status?: string
          techm_account_lead?: string | null
          techm_osp_lead?: string | null
          updated_at?: string
          use_customer_branding?: boolean
        }
        Relationships: [
          {
            foreignKeyName: "deals_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["id"]
          },
        ]
      }
      discussion_items: {
        Row: {
          area: string
          commercial_impact: string | null
          created_at: string
          deal_id: string
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
          deal_id: string
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
          deal_id?: string
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
        Relationships: [
          {
            foreignKeyName: "discussion_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      global_defaults: {
        Row: {
          approval_threshold_pct: number
          contract_years: number
          created_at: string
          currency: string
          id: string
          is_active: boolean
          marketplace_fee_pct: number
          min_license_gm_pct: number
          renewal_uplift_pct: number
          services_attach_pct: number
          services_gm_target_pct: number
          updated_at: string
        }
        Insert: {
          approval_threshold_pct?: number
          contract_years?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          marketplace_fee_pct?: number
          min_license_gm_pct?: number
          renewal_uplift_pct?: number
          services_attach_pct?: number
          services_gm_target_pct?: number
          updated_at?: string
        }
        Update: {
          approval_threshold_pct?: number
          contract_years?: number
          created_at?: string
          currency?: string
          id?: string
          is_active?: boolean
          marketplace_fee_pct?: number
          min_license_gm_pct?: number
          renewal_uplift_pct?: number
          services_attach_pct?: number
          services_gm_target_pct?: number
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
      incumbent_platforms: {
        Row: {
          annual_license_spend: number
          annual_services_spend: number
          contract_end_date: string | null
          created_at: string
          deal_id: string
          id: string
          notes: string | null
          product: string | null
          renewal_date: string | null
          replacement_annual_license_cost: number
          replacement_implementation_cost: number
          replacement_managed_services_cost: number
          replacement_salesforce_product: string | null
          replacement_users: number
          status: string
          updated_at: string
          users: number
          vendor: string
        }
        Insert: {
          annual_license_spend?: number
          annual_services_spend?: number
          contract_end_date?: string | null
          created_at?: string
          deal_id: string
          id?: string
          notes?: string | null
          product?: string | null
          renewal_date?: string | null
          replacement_annual_license_cost?: number
          replacement_implementation_cost?: number
          replacement_managed_services_cost?: number
          replacement_salesforce_product?: string | null
          replacement_users?: number
          status?: string
          updated_at?: string
          users?: number
          vendor: string
        }
        Update: {
          annual_license_spend?: number
          annual_services_spend?: number
          contract_end_date?: string | null
          created_at?: string
          deal_id?: string
          id?: string
          notes?: string | null
          product?: string | null
          renewal_date?: string | null
          replacement_annual_license_cost?: number
          replacement_implementation_cost?: number
          replacement_managed_services_cost?: number
          replacement_salesforce_product?: string | null
          replacement_users?: number
          status?: string
          updated_at?: string
          users?: number
          vendor?: string
        }
        Relationships: [
          {
            foreignKeyName: "incumbent_platforms_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      innovation_funds: {
        Row: {
          consumed: number
          created_at: string
          customer_funded: number
          deal_id: string
          drawdown_y1: number
          drawdown_y2: number
          drawdown_y3: number
          id: string
          name: string
          notes: string | null
          salesforce_funded: number
          status: string
          techm_funded: number
          template: string
          total_fund: number
          updated_at: string
        }
        Insert: {
          consumed?: number
          created_at?: string
          customer_funded?: number
          deal_id: string
          drawdown_y1?: number
          drawdown_y2?: number
          drawdown_y3?: number
          id?: string
          name?: string
          notes?: string | null
          salesforce_funded?: number
          status?: string
          techm_funded?: number
          template?: string
          total_fund?: number
          updated_at?: string
        }
        Update: {
          consumed?: number
          created_at?: string
          customer_funded?: number
          deal_id?: string
          drawdown_y1?: number
          drawdown_y2?: number
          drawdown_y3?: number
          id?: string
          name?: string
          notes?: string | null
          salesforce_funded?: number
          status?: string
          techm_funded?: number
          template?: string
          total_fund?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "innovation_funds_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
      marketplace_models: {
        Row: {
          commitment_remaining: number
          commitment_total: number
          cppo: boolean
          created_at: string
          deal_id: string
          drawdown_pct: number
          eligibility_status: string
          id: string
          is_enabled: boolean
          marketplace_fee_pct: number
          notes: string | null
          provider: string
          route: string
          updated_at: string
        }
        Insert: {
          commitment_remaining?: number
          commitment_total?: number
          cppo?: boolean
          created_at?: string
          deal_id: string
          drawdown_pct?: number
          eligibility_status?: string
          id?: string
          is_enabled?: boolean
          marketplace_fee_pct?: number
          notes?: string | null
          provider?: string
          route?: string
          updated_at?: string
        }
        Update: {
          commitment_remaining?: number
          commitment_total?: number
          cppo?: boolean
          created_at?: string
          deal_id?: string
          drawdown_pct?: number
          eligibility_status?: string
          id?: string
          is_enabled?: boolean
          marketplace_fee_pct?: number
          notes?: string | null
          provider?: string
          route?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_models_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
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
          deal_id: string
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
          deal_id: string
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
          deal_id?: string
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
        Relationships: [
          {
            foreignKeyName: "risk_log_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
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
          deal_id: string
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
          deal_id: string
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
          deal_id?: string
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
        Relationships: [
          {
            foreignKeyName: "scenarios_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      services_constructs: {
        Row: {
          annual_cost: number
          annual_fee: number
          attach_target_pct: number
          created_at: string
          deal_id: string
          id: string
          implementation_cost: number
          implementation_fee: number
          name: string
          notes: string | null
          scope: string | null
          updated_at: string
          years: number
        }
        Insert: {
          annual_cost?: number
          annual_fee?: number
          attach_target_pct?: number
          created_at?: string
          deal_id: string
          id?: string
          implementation_cost?: number
          implementation_fee?: number
          name?: string
          notes?: string | null
          scope?: string | null
          updated_at?: string
          years?: number
        }
        Update: {
          annual_cost?: number
          annual_fee?: number
          attach_target_pct?: number
          created_at?: string
          deal_id?: string
          id?: string
          implementation_cost?: number
          implementation_fee?: number
          name?: string
          notes?: string | null
          scope?: string | null
          updated_at?: string
          years?: number
        }
        Relationships: [
          {
            foreignKeyName: "services_constructs_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      sku_library: {
        Row: {
          billing_frequency: string
          billing_unit: string | null
          cloud: string | null
          created_at: string
          default_commercial_layer: string
          default_tower_key: string | null
          description: string | null
          edition: string | null
          id: string
          is_active: boolean
          metric: string | null
          product_category: string | null
          product_family: string | null
          sku_code: string | null
          sku_name: string
          unit_list_price: number
          unit_of_measure: string
          updated_at: string
          wholesale_unit_price: number
        }
        Insert: {
          billing_frequency?: string
          billing_unit?: string | null
          cloud?: string | null
          created_at?: string
          default_commercial_layer?: string
          default_tower_key?: string | null
          description?: string | null
          edition?: string | null
          id?: string
          is_active?: boolean
          metric?: string | null
          product_category?: string | null
          product_family?: string | null
          sku_code?: string | null
          sku_name: string
          unit_list_price?: number
          unit_of_measure?: string
          updated_at?: string
          wholesale_unit_price?: number
        }
        Update: {
          billing_frequency?: string
          billing_unit?: string | null
          cloud?: string | null
          created_at?: string
          default_commercial_layer?: string
          default_tower_key?: string | null
          description?: string | null
          edition?: string | null
          id?: string
          is_active?: boolean
          metric?: string | null
          product_category?: string | null
          product_family?: string | null
          sku_code?: string | null
          sku_name?: string
          unit_list_price?: number
          unit_of_measure?: string
          updated_at?: string
          wholesale_unit_price?: number
        }
        Relationships: []
      }
      sku_lines: {
        Row: {
          acquisition_unit_price: number
          approval_status: string
          approval_threshold_pct: number
          assumption_owner: string | null
          billing_frequency: string
          bom_type: string
          bulk_eligible: boolean
          category_discount_pct: number
          classification: string
          cloud: string | null
          commercial_layer: string
          coterm_date: string | null
          created_at: string
          current_contract_unit_price: number
          description: string | null
          discount_reason: string | null
          discountable: boolean
          edition: string | null
          end_date: string | null
          growth_category: string | null
          id: string
          line_discount_pct: number
          max_discount_pct: number
          metric: string | null
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
          acquisition_unit_price?: number
          approval_status?: string
          approval_threshold_pct?: number
          assumption_owner?: string | null
          billing_frequency?: string
          bom_type?: string
          bulk_eligible?: boolean
          category_discount_pct?: number
          classification?: string
          cloud?: string | null
          commercial_layer?: string
          coterm_date?: string | null
          created_at?: string
          current_contract_unit_price?: number
          description?: string | null
          discount_reason?: string | null
          discountable?: boolean
          edition?: string | null
          end_date?: string | null
          growth_category?: string | null
          id?: string
          line_discount_pct?: number
          max_discount_pct?: number
          metric?: string | null
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
          acquisition_unit_price?: number
          approval_status?: string
          approval_threshold_pct?: number
          assumption_owner?: string | null
          billing_frequency?: string
          bom_type?: string
          bulk_eligible?: boolean
          category_discount_pct?: number
          classification?: string
          cloud?: string | null
          commercial_layer?: string
          coterm_date?: string | null
          created_at?: string
          current_contract_unit_price?: number
          description?: string | null
          discount_reason?: string | null
          discountable?: boolean
          edition?: string | null
          end_date?: string | null
          growth_category?: string | null
          id?: string
          line_discount_pct?: number
          max_discount_pct?: number
          metric?: string | null
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
          deal_id: string
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
          deal_id: string
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
          deal_id?: string
          decision_status?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "towers_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
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
      validation_items: {
        Row: {
          check_key: string | null
          created_at: string
          deal_id: string
          detail: string | null
          id: string
          owner: string | null
          resolution: string | null
          scope: string
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          check_key?: string | null
          created_at?: string
          deal_id: string
          detail?: string | null
          id?: string
          owner?: string | null
          resolution?: string | null
          scope?: string
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          check_key?: string | null
          created_at?: string
          deal_id?: string
          detail?: string | null
          id?: string
          owner?: string | null
          resolution?: string | null
          scope?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "validation_items_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
      }
      value_levers: {
        Row: {
          annual_value: number
          category: string
          confidence: string
          created_at: string
          deal_id: string
          description: string | null
          id: string
          is_included: boolean
          term_value: number
          updated_at: string
        }
        Insert: {
          annual_value?: number
          category: string
          confidence?: string
          created_at?: string
          deal_id: string
          description?: string | null
          id?: string
          is_included?: boolean
          term_value?: number
          updated_at?: string
        }
        Update: {
          annual_value?: number
          category?: string
          confidence?: string
          created_at?: string
          deal_id?: string
          description?: string | null
          id?: string
          is_included?: boolean
          term_value?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "value_levers_deal_id_fkey"
            columns: ["deal_id"]
            isOneToOne: false
            referencedRelation: "deals"
            referencedColumns: ["id"]
          },
        ]
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
        | "osp_admin"
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
        "osp_admin",
      ],
    },
  },
} as const
