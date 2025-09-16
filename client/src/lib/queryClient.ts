import { QueryClient, QueryFunction } from "@tanstack/react-query";

// Token refresh response type
export interface TokenRefreshResponse {
  accessToken: string;
  user: any;
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  accessToken?: string | null,
): Promise<Response> {
  const headers: Record<string, string> = {};
  
  if (data) {
    headers["Content-Type"] = "application/json";
  }
  
  // Add Authorization header if access token is available
  if (accessToken) {
    headers["Authorization"] = `Bearer ${accessToken}`;
  }
  
  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include", // Always include cookies for fallback auth
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
  accessToken?: string | null;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior, accessToken }) =>
  async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Add Authorization header if access token is available
    if (accessToken) {
      headers["Authorization"] = `Bearer ${accessToken}`;
    }
    
    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include", // Always include cookies for fallback auth
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

// Create a token refresh handler function that will be set by AuthContext
let tokenRefreshHandler: (() => Promise<string | null>) | null = null;
let getCurrentAccessToken: (() => string | null) | null = null;

export function setTokenRefreshHandler(handler: (() => Promise<string | null>) | null) {
  tokenRefreshHandler = handler;
}

export function setAccessTokenGetter(getter: (() => string | null) | null) {
  getCurrentAccessToken = getter;
}

// Enhanced API request with automatic token refresh
export async function authAwareApiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
  accessToken?: string | null,
  skipRefresh = false,
): Promise<Response> {
  try {
    // Use provided token or get current one
    const tokenToUse = accessToken || (getCurrentAccessToken ? getCurrentAccessToken() : null);
    return await apiRequest(method, url, data, tokenToUse);
  } catch (error: any) {
    // If we get a 401 and have a token and refresh handler, try to refresh
    const currentToken = accessToken || (getCurrentAccessToken ? getCurrentAccessToken() : null);
    if (
      !skipRefresh &&
      error.message?.includes('401') &&
      currentToken &&
      tokenRefreshHandler
    ) {
      try {
        const newToken = await tokenRefreshHandler();
        if (newToken) {
          // Retry with new token, but skip refresh on retry to avoid infinite loops
          return await apiRequest(method, url, data, newToken);
        }
      } catch (refreshError) {
        console.error('Token refresh failed:', refreshError);
      }
    }
    throw error;
  }
}

// Create an enhanced query function that uses the current access token
const createAuthAwareQueryFn = (): QueryFunction => {
  return async ({ queryKey }) => {
    const headers: Record<string, string> = {};
    
    // Get current access token
    const accessToken = getCurrentAccessToken ? getCurrentAccessToken() : null;
    if (accessToken) {
      headers['Authorization'] = `Bearer ${accessToken}`;
    }
    
    const res = await fetch(queryKey.join('/') as string, {
      headers,
      credentials: 'include', // Always include cookies for fallback auth
    });

    if (!res.ok) {
      const text = (await res.text()) || res.statusText;
      throw new Error(`${res.status}: ${text}`);
    }
    
    return await res.json();
  };
};

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: createAuthAwareQueryFn(),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
