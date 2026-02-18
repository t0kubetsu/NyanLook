"use client";

import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import DevicePanel from "@/components/map/DevicePanel";
import {
  ApiError,
  fetchDeviceDetails,
  fetchDevices,
  fetchLocationHistory,
} from "@/lib/api";
import { clearToken, getToken } from "@/lib/auth";
import type { Device, DeviceDetails, LocationPoint } from "@/types/device";

const DeviceMap = dynamic(() => import("@/components/map/DeviceMap"), {
  ssr: false,
});

const REFRESH_MS = 30_000;

export default function MapPage() {
  const router = useRouter();

  const [devices, setDevices] = useState<Device[]>([]);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [details, setDetails] = useState<DeviceDetails | null>(null);
  const [locationHistory, setLocationHistory] = useState<LocationPoint[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [lastSync, setLastSync] = useState<Date | null>(null);
  const [error, setError] = useState<string | null>(null);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Fetch device list ───────────────────────────────────────────────────────
  const loadDevices = useCallback(async () => {
    const token = getToken();
    if (!token) {
      router.push("/login");
      return;
    }
    try {
      const data = await fetchDevices(token);
      setDevices(data);
      setLastSync(new Date());
      setError(null);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        clearToken();
        router.push("/login");
      } else setError("Failed to fetch devices");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    loadDevices();
    timerRef.current = setInterval(loadDevices, REFRESH_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [loadDevices]);

  // ── Select device — fetch details + history in parallel ────────────────────
  const selectDevice = useCallback(async (deviceId: string) => {
    setActiveId(deviceId);
    setDetails(null);
    setLocationHistory([]);
    setHistoryLoading(true);

    const token = getToken();
    if (!token) return;

    // Fire both requests at the same time
    const [detailsResult, historyResult] = await Promise.allSettled([
      fetchDeviceDetails(token, deviceId),
      fetchLocationHistory(token, deviceId, 100),
    ]);

    if (detailsResult.status === "fulfilled") setDetails(detailsResult.value);
    if (historyResult.status === "fulfilled")
      setLocationHistory(historyResult.value);

    setHistoryLoading(false);
  }, []);

  // ── Close panel ─────────────────────────────────────────────────────────────
  const closePanel = useCallback(() => {
    setActiveId(null);
    setDetails(null);
    setLocationHistory([]);
  }, []);

  function logout() {
    clearToken();
    router.push("/login");
  }

  const activeDevice = devices.find((d) => d.device_id === activeId) ?? null;

  return (
    <div
      className="flex flex-col bg-[#0a0c10] text-slate-200"
      style={{ height: "100vh" }}
    >
      {/* Header */}
      <header className="flex-none h-14 flex items-center gap-3 px-5 bg-[#111318] border-b border-[#1e2230] z-10">
        <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shadow-[0_0_10px_theme(colors.cyan.400)] animate-pulse" />
        <span className="font-mono text-xs tracking-[.12em] uppercase">
          NyanLook
        </span>
        <div className="flex-1" />
        <span className="font-mono text-[11px] text-slate-500">
          <span className="text-cyan-400 font-bold">{devices.length}</span>{" "}
          devices
        </span>
        {lastSync && (
          <span className="font-mono text-[11px] text-slate-600 hidden sm:block">
            Updated {lastSync.toLocaleTimeString()}
          </span>
        )}
        <button
          type="button"
          onClick={loadDevices}
          className="font-mono text-[11px] px-3 py-1.5 border border-[#1e2230] rounded-md hover:border-cyan-500 hover:text-cyan-400 transition-colors"
        >
          ↻ Refresh
        </button>
        <button
          type="button"
          onClick={logout}
          className="font-mono text-[11px] px-3 py-1.5 border border-[#1e2230] rounded-md hover:border-rose-500 hover:text-rose-400 transition-colors"
        >
          Sign out
        </button>
      </header>

      {/* Body */}
      <div className="flex flex-1 overflow-hidden min-h-0">
        <div className="flex-1 relative" style={{ minHeight: 0 }}>
          {loading ? (
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="w-8 h-8 border-2 border-[#1e2230] border-t-cyan-400 rounded-full animate-spin" />
            </div>
          ) : error ? (
            <div className="absolute inset-0 flex items-center justify-center text-sm text-slate-500">
              {error}
            </div>
          ) : devices.length === 0 ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-slate-600">
              <span className="text-4xl">📡</span>
              <p className="font-mono text-xs">No devices with location data</p>
            </div>
          ) : (
            <div style={{ position: "absolute", inset: 0 }}>
              <DeviceMap
                devices={devices}
                activeId={activeId}
                locationHistory={locationHistory}
                onSelect={selectDevice}
              />
            </div>
          )}
        </div>

        {activeDevice && (
          <DevicePanel
            device={activeDevice}
            details={details}
            historyCount={locationHistory.length}
            historyLoading={historyLoading}
            onClose={closePanel}
          />
        )}
      </div>

      {/* Bottom strip */}
      {!loading && devices.length > 0 && (
        <nav className="flex-none flex gap-2 px-4 py-2.5 bg-[#111318]/90 border-t border-[#1e2230] overflow-x-auto backdrop-blur">
          {devices.map((device) => {
            const platform = (
              device.infos?.summary?.platform ?? ""
            ).toLowerCase();
            const name =
              device.infos?.display_name ?? device.device_id.slice(0, 14);
            const isActive = device.device_id === activeId;
            return (
              <button
                key={device.device_id}
                type="button"
                onClick={() => selectDevice(device.device_id)}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg border flex-shrink-0 transition-colors text-left ${
                  isActive
                    ? "border-rose-500/50 bg-rose-500/10"
                    : "border-[#1e2230] bg-[#0a0c10] hover:border-cyan-500/50"
                }`}
              >
                <span
                  className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${
                    isActive
                      ? "bg-rose-400 shadow-[0_0_6px_theme(colors.rose.400)]"
                      : "bg-cyan-400 shadow-[0_0_6px_theme(colors.cyan.400)]"
                  }`}
                />
                <div>
                  <p className="text-xs font-medium text-white whitespace-nowrap">
                    {name}
                  </p>
                  <p className="font-mono text-[9px] text-slate-500 uppercase">
                    {platform || "device"}
                  </p>
                </div>
              </button>
            );
          })}
        </nav>
      )}
    </div>
  );
}
