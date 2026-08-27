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

function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    if (!supabase) {
      setReady(true);
      return;
    }

    // Get initial session — resolve fast so the UI renders immediately
    supabase.auth
      .getSession()
      .then(({ data: { session } }) => {
        setUser(session?.user ?? null);
        setReady(true);
      })
      .catch(() => {
        setReady(true);
      });

    // Listen for auth state changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  return (
    <DevAuthContext.Provider
      value={{
        isSignedIn: user !== null,
        user,
        signOut: () => supabase?.auth.signOut(),
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
