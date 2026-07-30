// cheque-frontend/src/app/config.ts

/**
 * Dynamically determines the backend API base URL.
 * At runtime on the client, it grabs the browser's current hostname (e.g., 'DESKTOP-GTKD861' or an IP)
 * so requests dynamically target port 5000 on the same machine.
 */
export const getApiBaseUrl = (): string => {
  if (typeof window !== 'undefined') {
    const host = window.location.hostname;
    return `http://${host}:5000`;
  }

  // Fallback for Server-Side Rendering (SSR) / build time
  return process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
};

/**
 * Getter property so components using `API_BASE_URL` dynamically evaluate 
 * the URL at call time rather than locking in 'localhost' during SSR.
 */
export const config = {
  get API_BASE_URL(): string {
    return getApiBaseUrl();
  },
};

// Backwards compatibility export for existing component imports
export const API_BASE_URL = getApiBaseUrl();