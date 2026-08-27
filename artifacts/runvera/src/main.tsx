import {
  createContext,
  type ReactNode,
  useContext,
  useEffect,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ErrorBoundary } from "@/components/error-boundary";
import {
  supabaseConfigured,
  supabaseUrl,
  supabaseAnonKey,
} from "@/lib/supabase-config";
import { supabase } from "@workspace/supabase/client";
import type { User } from "@workspace/supabase";
import App from "./App";

import "./index.css";

// ---------------------------------------------------------------------------
// Dev auth (used when Supabase is not configured)
// ---------------------------------------------------------------------------

export const DevAuthContext = createContext({
  isSignedIn: false,
  user: null as User | null,
  signOut: () => {},
});

function DevAuthProvider({ children }: { children: ReactNode }) {
  return (
    <DevAuthContext.Provider
      value={{
        isSignedIn: true,
        user: null,
        signOut: () => {
          window.location.href = "/";
        },
      }}
    >
      {children}
    </DevAuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Supabase auth provider — listens for session changes
// ---------------------------------------------------------------------------

interface SupabaseAuthState {
  user: User | null;
  loading: boolean;
}

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<SupabaseAuthState>({
    user: null,
    loading: true,
  });

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setState({ user: session?.user ?? null, loading: false });
    });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setState({ user: session?.user ?? null, loading: false });
    });

    return () => subscription.unsubscribe();
  }, []);

  if (state.loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <span className="text-muted-foreground text-sm">Loading…</span>
      </div>
    );
  }

  return (
    <DevAuthContext.Provider
      value={{
        isSignedIn: state.user !== null,
        user: state.user,
        signOut: () => supabase.auth.signOut(),
      }}
    >
      {children}
    </DevAuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function AuthProviders({ children }: { children: ReactNode }) {
  if (!supabaseConfigured) {
    return <DevAuthProvider>{children}</DevAuthProvider>;
  }
  return <SupabaseAuthProvider>{children}</SupabaseAuthProvider>;
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

createRoot(document.getElementById("root")!, {
  onCaughtError: (error, errorInfo) => {
    console.error(error, errorInfo.componentStack);
  },
}).render(
  <ErrorBoundary>
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <AuthProviders>
          <App />
        </AuthProviders>
      </TooltipProvider>
    </QueryClientProvider>
  </ErrorBoundary>,
);
