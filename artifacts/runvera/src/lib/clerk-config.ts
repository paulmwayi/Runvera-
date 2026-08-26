/**
 * Clerk configuration for Runvera.
 *
 * Publishable key and proxy URL are read from Vite env vars. The proxy URL
 * defaults to the backend's Clerk proxy path (`/api/__clerk`) so the frontend
 * never needs to hit Clerk's FAPI directly (which requires CNAME setup).
 *
 * The publishable key is validated before enabling Clerk to prevent a white
 * screen when the key is empty, malformed, or missing the `pk_` prefix.
 */

import { shadcn } from '@clerk/themes';

// ---------------------------------------------------------------------------
// Environment variables
// ---------------------------------------------------------------------------

const rawPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

/**
 * Validates the publishable key format. Clerk keys must start with `pk_test_`
 * or `pk_live_` and contain at least 10 more characters after the prefix.
 *
 * A `pk_test_` key in production would make `clerkConfigured` truthy, causing
 * the app to initialize Clerk against the wrong instance — a known source of
 * white-page issues.
 */
function isValidPubKey(key: string | undefined): key is string {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();
  return (
    (trimmed.startsWith('pk_test_') || trimmed.startsWith('pk_live_')) &&
    trimmed.length > 10
  );
}

export const clerkPubKey = isValidPubKey(rawPubKey) ? rawPubKey.trim() : '';

/**
 * Whether Clerk is properly configured. When false, the app uses a local
 * DevAuthProvider that treats every visitor as signed-in — the dashboard is
 * always accessible without external auth.
 */
export const clerkConfigured = clerkPubKey !== '';

/**
 * Proxy URL for Clerk's Frontend API. The backend exposes a proxy at
 * `/api/__clerk` (see `clerkProxyMiddleware.ts`) that forwards requests to
 * `https://frontend-api.clerk.dev`. Using the proxy avoids CNAME requirements
 * and works on any custom domain or deployment.
 *
 * Falls back to `/api/__clerk` when the env var is not set.
 */
export const clerkProxyUrl =
  import.meta.env.VITE_CLERK_PROXY_URL || '/api/__clerk';

// ---------------------------------------------------------------------------
// Appearance
// ---------------------------------------------------------------------------

export const clerkAppearance = {
  theme: shadcn,
  cssLayerName: 'clerk',
  options: {
    logoPlacement: 'inside' as const,
    logoLinkUrl: '/',
    logoImageUrl: `${window.location.origin}/logo.svg`,
  },
  variables: {
    colorPrimary: '#5550D9',
    colorForeground: '#151A2D',
    colorMutedForeground: '#657083',
    colorDanger: '#C7465B',
    colorBackground: '#FFFFFF',
    colorInput: '#F7F8FC',
    colorInputForeground: '#151A2D',
    colorNeutral: '#DDE2EF',
    fontFamily: 'Manrope, sans-serif',
    borderRadius: '1rem',
  },
  elements: {
    rootBox: 'w-full flex justify-center',
    cardBox: 'bg-white rounded-2xl w-[440px] max-w-full overflow-hidden shadow-xl',
    card: '!shadow-none !border-0 !bg-transparent !rounded-none',
    footer: '!shadow-none !border-0 !bg-transparent !rounded-none',
    headerTitle: 'text-[#151A2D] font-bold',
    headerSubtitle: 'text-[#657083]',
    socialButtonsBlockButtonText: 'text-[#151A2D]',
    formFieldLabel: 'text-[#151A2D] font-semibold',
    footerActionLink: 'text-[#5550D9] font-semibold',
    footerActionText: 'text-[#657083]',
    dividerText: 'text-[#657083]',
    identityPreviewEditButton: 'text-[#5550D9]',
    formFieldSuccessText: 'text-[#168A67]',
    alertText: 'text-[#C7465B]',
    logoBox: 'mb-3',
    logoImage: 'max-h-10',
    socialButtonsBlockButton: 'border-[#DDE2EF] bg-white',
    formButtonPrimary: 'bg-[#5550D9] hover:bg-[#4843C4] text-white',
    formFieldInput: 'bg-[#F7F8FC] border-[#DDE2EF] text-[#151A2D]',
    footerAction: 'bg-transparent',
    dividerLine: 'bg-[#DDE2EF]',
    alert: 'bg-[#FFF4F5] border-[#F2C9D0]',
    otpCodeFieldInput: 'border-[#DDE2EF] text-[#151A2D]',
    formFieldRow: 'mb-4',
    main: 'gap-5',
  },
};
