import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

export function useApi() {
  const { accessToken, logout } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const headers = {
        "Content-Type": "application/json",
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
        ...options.headers,
      };

      try {
        const response = await fetch(`${API_URL}${path}`, {
          ...options,
          headers,
        });

        if (response.status === 401) {
          logout();
          throw new Error("Unauthorized");
        }

        if (!response.ok) {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.detail || "Something went wrong");
        }

        return await response.json();
      } catch (error: any) {
        console.error(`API Error [${path}]:`, error.message);
        throw error;
      }
    },
    [API_URL, accessToken, logout],
  );

  return useMemo(
    () => ({
      get: (path: string) => request(path, { method: "GET" }),
      post: (path: string, body: any) =>
        request(path, { method: "POST", body: JSON.stringify(body) }),
      patch: (path: string, body: any) =>
        request(path, { method: "PATCH", body: JSON.stringify(body) }),
      del: (path: string) => request(path, { method: "DELETE" }),
    }),
    [request],
  );
}
