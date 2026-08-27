import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@workspace/supabase/client";
import { useContext } from "react";
import { DevAuthContext } from "@/main";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type BusinessState = {
  revenue: number;
  expenses: number;
  cash: number;
  growth: number;
  customers: number;
  assets: number;
  liabilities: number;
  seats: number;
};

type BackendBusiness = {
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

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const DEFAULT_BUSINESS: BusinessState = {
  revenue: 0,
  expenses: 0,
  cash: 0,
  growth: 0,
  customers: 0,
  assets: 0,
  liabilities: 0,
  seats: 0,
};

const SEATS_STORAGE_KEY = "runvera-seats";

// ---------------------------------------------------------------------------
// Conversion helpers (front-end uses dollars, Supabase uses cents / basis-points)
// ---------------------------------------------------------------------------

function centsToDollars(cents: number): number {
  return cents / 100;
}

function dollarsToCents(dollars: number): number {
  return Math.round(dollars * 100);
}

function bpsToPercent(bps: number): number {
  return bps / 100;
}

function percentToBps(pct: number): number {
  return Math.round(pct * 100);
}

function backendToFrontend(biz: BackendBusiness, seats: number): BusinessState {
  return {
    revenue: centsToDollars(biz.monthly_revenue_cents),
    expenses: centsToDollars(biz.monthly_expenses_cents),
    cash: centsToDollars(biz.cash_balance_cents),
    growth: bpsToPercent(biz.monthly_growth_rate_bps),
    customers: biz.active_customers,
    assets: centsToDollars(biz.assets_cents),
    liabilities: centsToDollars(biz.liabilities_cents),
    seats,
  };
}

function frontendToBackend(state: BusinessState) {
  return {
    name: "My Business",
    industry: "",
    currency: "USD",
    cash_balance_cents: dollarsToCents(state.cash),
    monthly_revenue_cents: dollarsToCents(state.revenue),
    monthly_expenses_cents: dollarsToCents(state.expenses),
    net_profit_cents: dollarsToCents(state.revenue - state.expenses),
    assets_cents: dollarsToCents(state.assets),
    liabilities_cents: dollarsToCents(state.liabilities),
    monthly_growth_rate_bps: percentToBps(state.growth),
    active_customers: state.customers,
  };
}

// ---------------------------------------------------------------------------
// LocalStorage helpers for seats (not stored in the backend)
// ---------------------------------------------------------------------------

function getLocalSeats(): number {
  try {
    const raw = localStorage.getItem(SEATS_STORAGE_KEY);
    return raw != null ? Number(raw) : 0;
  } catch {
    return 0;
  }
}

function setLocalSeats(seats: number): void {
  try {
    localStorage.setItem(SEATS_STORAGE_KEY, String(seats));
  } catch {
    // ignore
  }
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useBusiness() {
  const queryClient = useQueryClient();
  const { user } = useContext(DevAuthContext);

  // Fetch the existing business record from Supabase.
  // Falls back to defaults when not authenticated or on error.
  const { data: backendBusiness, isLoading } = useQuery<BackendBusiness | null>({
    queryKey: ["business"],
    queryFn: async () => {
      if (!user) return null;
      try {
        if (!supabase) return null;
        const { data, error } = await supabase
          .from("businesses")
          .select("*")
          .eq("owner_user_id", user.id)
          .limit(1)
          .maybeSingle();

        if (error) {
          console.error("Failed to fetch business:", error.message);
          return null;
        }
        return data;
      } catch {
        return null;
      }
    },
    enabled: !!user && !!supabase,
    staleTime: 30_000,
  });

  // Create (first save) or upsert business in Supabase.
  const upsertMutation = useMutation({
    mutationFn: async (state: BusinessState) => {
      if (!user || !supabase) throw new Error("Not authenticated");
      const row = frontendToBackend(state);
      const { data, error } = await supabase
        .from("businesses")
        .upsert(
          { ...row, owner_user_id: user.id },
          { onConflict: "owner_user_id" },
        )
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["business"] }),
  });

  // Partial update for subsequent saves.
  const updateMutation = useMutation({
    mutationFn: async (state: BusinessState) => {
      if (!user || !supabase) throw new Error("Not authenticated");
      const row = frontendToBackend(state);
      const { data, error } = await supabase
        .from("businesses")
        .update(row)
        .eq("owner_user_id", user.id)
        .select()
        .single();

      if (error) throw error;
      return data;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["business"] }),
  });

  const seats = getLocalSeats();

  const business: BusinessState = backendBusiness
    ? backendToFrontend(backendBusiness, seats)
    : { ...DEFAULT_BUSINESS, seats };

  /** Save the full model to Supabase (creates on first call, updates after). */
  const updateBusiness = (updates: Partial<BusinessState>) => {
    const next = { ...business, ...updates };

    if (updates.seats !== undefined) {
      setLocalSeats(updates.seats);
    }

    if (backendBusiness) {
      updateMutation.mutate(next);
    } else {
      upsertMutation.mutate(next);
    }
  };

  /** Reset to defaults. */
  const resetBusiness = () => {
    const defaults = { ...DEFAULT_BUSINESS, seats: getLocalSeats() };

    if (backendBusiness) {
      updateMutation.mutate(defaults);
    } else {
      queryClient.setQueryData<BackendBusiness | null>(["business"], null);
    }
  };

  return { business, updateBusiness, resetBusiness, isLoading };
}
