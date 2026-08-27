/**
 * Auto-generated Supabase Database types.
 *
 * Keep this file in sync with the SQL migration in supabase/migrations/.
 * You can regenerate these types via:
 *   npx supabase gen types typescript --project-id <ref> > lib/supabase/src/types.ts
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export interface Database {
  public: {
    Tables: {
      businesses: {
        Row: {
          id: number;
          owner_user_id: string;
          name: string;
          industry: string;
          currency: string;
          cash_balance_cents: number;
          monthly_revenue_cents: number;
          monthly_expenses_cents: number;
          net_profit_cents: number;
          assets_cents: number;
          liabilities_cents: number;
          monthly_growth_rate_bps: number;
          active_customers: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: number;
          owner_user_id: string;
          name: string;
          industry?: string;
          currency?: string;
          cash_balance_cents?: number;
          monthly_revenue_cents?: number;
          monthly_expenses_cents?: number;
          net_profit_cents?: number;
          assets_cents?: number;
          liabilities_cents?: number;
          monthly_growth_rate_bps?: number;
          active_customers?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: number;
          owner_user_id?: string;
          name?: string;
          industry?: string;
          currency?: string;
          cash_balance_cents?: number;
          monthly_revenue_cents?: number;
          monthly_expenses_cents?: number;
          net_profit_cents?: number;
          assets_cents?: number;
          liabilities_cents?: number;
          monthly_growth_rate_bps?: number;
          active_customers?: number;
          created_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
    CompositeTypes: Record<string, never>;
  };
}
