/* eslint-disable @typescript-eslint/no-explicit-any */
import { getMock } from "@/lib/mockStore";

export type ApiEnvelope<T> = { success: boolean; message?: string; data: T };

export async function apiGet<T>(path: string, params?: Record<string, string | undefined>): Promise<T> {
  const url = new URL(path, typeof window !== "undefined" ? window.location.origin : "http://localhost:3000");
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v != null && v !== "" && v !== "All") url.searchParams.set(k, v);
    });
  }
  const token = typeof window !== "undefined" ? localStorage.getItem("sih_token") : null;
  try {
    const res = await fetch(url.toString(), {
      cache: "no-store",
      headers: token ? { Authorization: `Bearer ${token}` } : undefined,
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = (await res.json()) as ApiEnvelope<T>;
    if (!json.success && json.data == null) throw new Error(json.message || "failed");
    return json.data;
  } catch {
    const mock = getMock(path);
    if (mock !== null) return mock as T;
    throw new Error(`No mock for ${path}`);
  }
}

export async function apiPost<T>(path: string, body: unknown): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("sih_token") : null;
  try {
    const res = await fetch(path, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = (await res.json()) as ApiEnvelope<T>;
    return json.data;
  } catch {
    const mock = getMock(path);
    if (mock !== null) return mock as T;
    return { id: Date.now(), status: "RECORDED" } as T;
  }
}

export async function apiPatch<T>(path: string, body: unknown): Promise<T> {
  const token = typeof window !== "undefined" ? localStorage.getItem("sih_token") : null;
  try {
    const res = await fetch(path, {
      method: "PATCH",
      headers: { "Content-Type": "application/json", ...(token ? { Authorization: `Bearer ${token}` } : {}) },
      body: JSON.stringify(body),
    });
    if (!res.ok) throw new Error(`${res.status}`);
    const json = (await res.json()) as ApiEnvelope<T>;
    return json.data;
  } catch {
    return (body || {}) as T;
  }
}