import type { Device, DeviceInfos, DevicesResponse } from "@/types/device";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

// ── Core fetcher ──────────────────────────────────────────────────────────────

async function apiFetch<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
      ...options.headers,
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? res.statusText);
  }

  return res.json() as Promise<T>;
}

// ── Auth ──────────────────────────────────────────────────────────────────────

export async function loginRequest(
  username: string,
  password: string,
): Promise<string> {
  const res = await fetch(`${API_URL}/auth/token`, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ username, password }),
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? "Login failed");
  }

  const data = await res.json();
  return data.access_token as string;
}

// ── Devices ───────────────────────────────────────────────────────────────────

export async function fetchDevices(token: string): Promise<Device[]> {
  const data = await apiFetch<DevicesResponse>("/devices", token);
  return data.devices;
}

export async function fetchDeviceDetails(
  token: string,
  deviceId: string,
): Promise<DeviceInfos> {
  return apiFetch<DeviceInfos>(`/device/${deviceId}/details`, token);
}

export { ApiError };
