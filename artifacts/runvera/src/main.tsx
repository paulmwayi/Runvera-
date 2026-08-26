import { createContext, type ReactNode, useContext } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ClerkProvider } from '@clerk/react';
import { TooltipProvider } from '@/components/ui/tooltip';
import { ErrorBoundary } from '@/components/error-boundary';
import {
  clerkConfigured,
  clerkPubKey,
  clerkProxyUrl,
  clerkAppearance,
} from '@/lib/clerk-config';
import App from './App';

import './index.css';

// ---------------------------------------------------------------------------
// Dev auth (used when Clerk is not configured, or when Clerk init fails)
// ---------------------------------------------------------------------------

export const DevAuthContext = createContext({
  isSignedIn: false,
  signOut: () => {},
});

function DevAuthProvider({ children }: { children: ReactNode }) {
  return (
    <DevAuthContext.Provider
      value={{
        isSignedIn: true,
        signOut: () => {
          window.location.href = '/';
        },
      }}
    >
      {children}
    </DevAuthContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Clerk error boundary — catches Clerk JS initialization failures and falls
// back to DevAuthProvider so the dashboard is always accessible.
// ---------------------------------------------------------------------------

interface ClerkBoundaryState {
  hasError: boolean;
}

class ClerkBoundary extends React.Component<
  { children: ReactNode; fallback: ReactNode },
  ClerkBoundaryState
> {
  state: ClerkBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ClerkBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: unknown, info: React.ErrorInfo): void {
    console.error('[ClerkBoundary] Clerk initialization failed — falling back to DevAuth:', error, info.componentStack);
    // Also show a visible console warning so the user knows what happened
    console.warn(
      '[ClerkBoundary] The Clerk publishable key is set but Clerk could not initialize. '
      + 'Possible causes: invalid key, missing backend CLERK_SECRET_KEY, or network error. '
      + 'The app is running in development mode (no auth required).'
    );
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// Need React import for the class component above
import React from 'react';

// ---------------------------------------------------------------------------
// Providers
// ---------------------------------------------------------------------------

const queryClient = new QueryClient();
const basePath = import.meta.env.BASE_URL.replace(/\/$/, '');

// Wrap the app with the appropriate auth provider
function AuthProviders({ children }: { children: ReactNode }) {
  if (!clerkConfigured) {
    return <DevAuthProvider>{children}</DevAuthProvider>;
  }

  return (
    <ClerkBoundary fallback={<DevAuthProvider>{children}</DevAuthProvider>}>
      <ClerkProvider
        publishableKey={clerkPubKey}
        proxyUrl={clerkProxyUrl}
        appearance={clerkAppearance}
        signInUrl={`${basePath}/sign-in`}
        signUpUrl={`${basePath}/sign-up`}
        signInFallbackRedirectUrl={`${basePath}/command`}
        signUpFallbackRedirectUrl={`${basePath}/command`}
      >
        {children}
      </ClerkProvider>
    </ClerkBoundary>
  );
}

// ---------------------------------------------------------------------------
// Mount
// ---------------------------------------------------------------------------

createRoot(document.getElementById('root')!, {
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
