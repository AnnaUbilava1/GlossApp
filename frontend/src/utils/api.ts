import { Platform } from "react-native";
import { API_BASE_URL } from "./config";

type ApiError = {
  error?: string;
  message?: string;
  errors?: unknown;
};

export async function apiFetch<T>(
  path: string,
  options: RequestInit & { token?: string } = {}
): Promise<T> {
  // Ensure API_BASE_URL doesn't have trailing slash and path starts with /
  const baseUrl = API_BASE_URL.replace(/\/$/, "");
  const normalizedPath = path.startsWith("/") ? path : `/${path}`;
  const url = `${baseUrl}${normalizedPath}`;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    // Add platform header for Expo
    "expo-platform": Platform.OS,
    ...(options.headers as Record<string, string> | undefined),
  };

  if (options.token) {
    headers.Authorization = `Bearer ${options.token}`;
  }

  try {
    const res = await fetch(url, {
      ...options,
      headers,
    });

    const text = await res.text();
    let data: unknown = null;

    // Try to parse JSON, but handle non-JSON responses gracefully
    if (text) {
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        // If response is not JSON (e.g., "Not found" or HTML), use the text as error message
        if (!res.ok) {
          throw new Error(text || `Request failed (${res.status})`);
        }
      }
    }

    if (!res.ok) {
      const err = (data || {}) as ApiError;
      const msg =
        err.error ||
        err.message ||
        text ||
        `Request failed (${res.status})`;
      throw new Error(msg);
    }

    return data as T;
  } catch (error) {
    // Handle network errors (e.g., "Network request failed")
    if (error instanceof TypeError && error.message.includes("fetch")) {
      throw new Error(
        `Network error: Unable to connect to server at ${baseUrl}. Please check your connection and ensure the backend is running.`
      );
    }
    throw error;
  }
}


