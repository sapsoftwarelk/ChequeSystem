// cheque-frontend/app/config.ts

/**
 * Dynamically determines the backend API base URL.
 * Prioritizes process.env.NEXT_PUBLIC_API_URL if set.
 */
export const getApiBaseUrl = (): string => {
  // 1. Always prioritize configured environment variable
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }

  // 2. Client-side fallback: check if running over HTTPS
  if (typeof window !== 'undefined') {
    if (window.location.protocol === 'https:') {
      return `https://${window.location.hostname}/api`;
    }
    const host = window.location.hostname;
    return `http://${host}:5001/api`; // 👈 Added /api (and updated port to 5001 if your backend runs on 5001)
  }

  // 3. Fallback for SSR / Local Development
  return 'http://localhost:5001/api'; // 👈 Added /api here too
};

/**
 * Getter property so components using `API_BASE_URL` dynamically evaluate
 * the URL at call time rather than locking in an initial value.
 */
export const config = {
  get API_BASE_URL(): string {
    return getApiBaseUrl();
  },
};

// Backwards compatibility export for existing component imports
export const API_BASE_URL = getApiBaseUrl();