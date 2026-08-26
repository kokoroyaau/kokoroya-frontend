import { redirect } from "next/navigation";
import { getToken, getSelectedBranch } from "@/lib/auth";
import { env } from "@/env";

const BASE_URL = env.NEXT_PUBLIC_API_URL;

export interface BaseResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

function buildUrl(path: string): string {
  return new URL(
    `v1/${path.replace(/^\//, "")}`,
    BASE_URL.replace(/\/?$/, "/"),
  ).toString();
}

async function request<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  path: string,
  body?: unknown,
  init?: RequestInit,
): Promise<T> {
  const token = await getToken();
  const branchId = await getSelectedBranch();
  const res = await fetch(buildUrl(path), {
    ...init,
    method,
    headers: {
      ...(body !== undefined && { "Content-Type": "application/json" }),
      ...(token && { Authorization: `Bearer ${token}` }),
      ...(branchId && { "X-Branch-ID": branchId }),
      ...init?.headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 204) return undefined as T;

  if (res.status === 401 && token) {
    // Stale/invalid token: go through a Route Handler (allowed to mutate
    // cookies, unlike a Server Component render) that clears the cookie
    // before landing on /sign-in — otherwise proxy.ts still sees a
    // "present" token there and bounces back to "/", looping forever.
    if (typeof window === "undefined") {
      redirect("/api/clear-session");
    } else {
      // redirect() only works during server render; api calls also happen
      // client-side (event handlers), where it just throws uncaught.
      window.location.href = "/api/clear-session";
      return new Promise<T>(() => {}); // navigating away, stop here
    }
  }

  const json: BaseResponse<unknown> = await res.json().catch(() => ({
    success: false,
    error: res.statusText,
  }));

  if (!json.success) {
    throw new Error(json.error || `Request failed with status ${res.status}`);
  }

  return json as T;
}

export const api = {
  get: <T>(path: string, init?: RequestInit) =>
    request<T>("GET", path, undefined, init),
  post: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>("POST", path, body, init),
  put: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>("PUT", path, body, init),
  patch: <T>(path: string, body?: unknown, init?: RequestInit) =>
    request<T>("PATCH", path, body, init),
  delete: <T>(path: string, init?: RequestInit) =>
    request<T>("DELETE", path, undefined, init),
};
