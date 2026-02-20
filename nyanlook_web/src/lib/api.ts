import type {
  Device,
  DeviceDetails,
  DevicesResponse,
  LocationHistory,
  LocationPoint,
} from "@/types/device";

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message);
  }
}

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

export async function loginRequest(
  username: string,
  password: string,
): Promise<string> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}/auth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ username, password }),
    });
  } catch (err) {
    throw new ApiError(0, `Cannot reach API at ${API_URL}. (${err})`);
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new ApiError(res.status, body.detail ?? "Login failed");
  }
  const data = await res.json();
  if (!data.access_token)
    throw new ApiError(0, `Unexpected response: ${JSON.stringify(data)}`);
  return data.access_token as string;
}

export async function fetchDevices(token: string): Promise<Device[]> {
  const data = await apiFetch<DevicesResponse>("/devices", token);
  return data.devices;
}

export async function fetchDeviceDetails(
  token: string,
  deviceId: string,
): Promise<DeviceDetails> {
  return apiFetch<DeviceDetails>(`/device/${deviceId}/details`, token);
}

export async function fetchLocationHistory(
  token: string,
  deviceId: string,
  limit = 100,
): Promise<LocationPoint[]> {
  const data = await apiFetch<LocationHistory>(
    `/device/${deviceId}/location/history?limit=${limit}`,
    token,
  );
  return data.history;
}
