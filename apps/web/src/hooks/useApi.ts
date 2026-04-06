import { useCallback, useMemo } from "react";
import { useAuth } from "@/context/AuthContext";

function formatErrorDetail(detail: unknown): string {
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((e: { msg?: string }) => e?.msg || JSON.stringify(e))
      .join("; ");
  }
  if (detail && typeof detail === "object" && "message" in detail) {
    return String((detail as { message: unknown }).message);
  }
  return "Something went wrong";
}

async function parseJsonResponse(response: Response): Promise<unknown> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export function useApi() {
  const { accessToken, logout } = useAuth();
  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8001";

  const request = useCallback(
    async (path: string, options: RequestInit = {}) => {
      const isFormData =
        typeof FormData !== "undefined" && options.body instanceof FormData;

      const headers: Record<string, string> = {
        ...(accessToken ? { Authorization: `Bearer ${accessToken}` } : {}),
      };

      if (!isFormData) {
        headers["Content-Type"] = "application/json";
      }

      const extra = options.headers as Record<string, string> | undefined;
      if (extra) {
        Object.assign(headers, extra);
      }

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
          const errorData = (await parseJsonResponse(response)) as {
            detail?: unknown;
          };
          throw new Error(formatErrorDetail(errorData?.detail));
        }

        return (await parseJsonResponse(response)) as any;
      } catch (error: unknown) {
        const message =
          error instanceof Error ? error.message : "Unknown error";
        console.error(`API Error [${path}]:`, message);
        throw error instanceof Error ? error : new Error(message);
      }
    },
    [API_URL, accessToken, logout],
  );

  return useMemo(
    () => ({
      get: (path: string) => request(path, { method: "GET" }),
      post: (path: string, body: unknown) =>
        request(path, { method: "POST", body: JSON.stringify(body) }),
      postFormData: (path: string, formData: FormData) =>
        request(path, { method: "POST", body: formData }),
      patch: (path: string, body: unknown) =>
        request(path, { method: "PATCH", body: JSON.stringify(body) }),
      del: (path: string) => request(path, { method: "DELETE" }),
    }),
    [request],
  );
}
