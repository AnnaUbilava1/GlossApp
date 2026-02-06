import { Platform } from "react-native";

/**
 * Sets up global fetch interceptor to add expo-platform header to all requests
 * This fixes the "Must specify expo-platform header" error for Expo Router internal requests
 */
export function setupGlobalFetchInterceptor() {
  // Only set up once
  if ((global as any).__EXPO_FETCH_INTERCEPTED__) {
    return;
  }

  // Store original fetch
  const originalFetch = global.fetch;

  // Override global fetch
  global.fetch = function (
    input: RequestInfo | URL,
    init?: RequestInit
  ): Promise<Response> {
    // Ensure init exists
    const options = init || {};

    // Ensure headers exist
    const headers = new Headers(options.headers);

    // Add expo-platform header if not already present
    // This is required for Expo Router internal requests
    if (!headers.has("expo-platform")) {
      headers.set("expo-platform", Platform.OS);
    }

    // Also try to add platform query parameter for string URLs (Expo Router fallback)
    let finalInput: RequestInfo | URL = input;
    if (typeof input === "string" && !input.includes("platform=")) {
      try {
        // Only modify URLs that look like Expo dev server URLs
        if (
          input.startsWith("/") ||
          input.includes("localhost") ||
          input.includes("127.0.0.1") ||
          /^\d+\.\d+\.\d+\.\d+/.test(input)
        ) {
          const separator = input.includes("?") ? "&" : "?";
          finalInput = `${input}${separator}platform=${Platform.OS}`;
        }
      } catch {
        // If anything fails, use original input
        finalInput = input;
      }
    }

    // Call original fetch with modified options
    return originalFetch(finalInput, {
      ...options,
      headers,
    });
  };

  // Mark as intercepted
  (global as any).__EXPO_FETCH_INTERCEPTED__ = true;
}

