import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { customFetch } from '@workspace/api-client-react';

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
  ownerClerkUserId: string;
  name: string;
  industry: string;
  currency: string;
  cashBalanceCents: number;
  monthlyRevenueCents: number;
  monthlyExpensesCents: number;
  netProfitCents: number;
  assetsCents: number;
  liabilitiesCents: number;
  monthlyGrowthRateBps: number;
  activeCustomers: number;
  createdAt: string;
  updatedAt: string;
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

const SEATS_STORAGE_KEY = 'runvera-seats';

// ---------------------------------------------------------------------------
// Conversion helpers (front-end uses dollars, API uses cents / basis-points)
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
    revenue: centsToDollars(biz.monthlyRevenueCents),
    expenses: centsToDollars(biz.monthlyExpensesCents),
    cash: centsToDollars(biz.cashBalanceCents),
    growth: bpsToPercent(biz.monthlyGrowthRateBps),
    customers: biz.activeCustomers,
    assets: centsToDollars(biz.assetsCents),
    liabilities: centsToDollars(biz.liabilitiesCents),
    seats,
  };
}

function frontendToBackend(state: BusinessState) {
  return {
    name: 'My Business',
    industry: '',
    currency: 'USD',
    cashBalanceCents: dollarsToCents(state.cash),
    monthlyRevenueCents: dollarsToCents(state.revenue),
    monthlyExpensesCents: dollarsToCents(state.expenses),
    netProfitCents: dollarsToCents(state.revenue - state.expenses),
    assetsCents: dollarsToCents(state.assets),
    liabilitiesCents: dollarsToCents(state.liabilities),
    monthlyGrowthRateBps: percentToBps(state.growth),
    activeCustomers: state.customers,
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

  // Fetch the existing business record from the backend.
  const { data: backendBusiness, isLoading } = useQuery<BackendBusiness | null>({
    queryKey: ['business'],
    queryFn: () => customFetch<BackendBusiness | null>('/api/business'),
    staleTime: 30_000,
  });

  // Create (first save) or upsert (onConflictDoUpdate in the backend).
  const upsertMutation = useMutation({
    mutationFn: (state: BusinessState) =>
      customFetch<BackendBusiness>('/api/business', {
        method: 'POST',
        body: JSON.stringify(frontendToBackend(state)),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business'] }),
  });

  // Partial update for subsequent saves.
  const updateMutation = useMutation({
    mutationFn: (state: BusinessState) =>
      customFetch<BackendBusiness>('/api/business', {
        method: 'PATCH',
        body: JSON.stringify(frontendToBackend(state)),
      }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['business'] }),
  });

  const seats = getLocalSeats();

  const business: BusinessState = backendBusiness
    ? backendToFrontend(backendBusiness, seats)
    : { ...DEFAULT_BUSINESS, seats };

  /** Save the full model to the backend (creates on first call, updates after). */
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
      queryClient.setQueryData<BackendBusiness | null>(['business'], null);
    }
  };

  return { business, updateBusiness, resetBusiness, isLoading };
}
