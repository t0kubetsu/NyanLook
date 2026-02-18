"use client";

import type { Device, DeviceDetails } from "@/types/device";

interface Props {
  device: Device;
  details: DeviceDetails | null;
  historyCount: number;
  historyLoading: boolean;
  onClose: () => void;
}

function Row({
  label,
  value,
}: {
  label: string;
  value?: string | number | boolean | null;
}) {
  if (value === undefined || value === null || value === "") return null;
  return (
    <div className="grid grid-cols-2 gap-2 py-2.5 border-b border-[#1e2230] last:border-0">
      <span className="text-xs text-slate-500">{label}</span>
      <span className="text-xs font-mono text-slate-200 text-right break-all">
        {String(value)}
      </span>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-5">
      <p className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 mb-2">
        {title}
      </p>
      <div className="bg-[#0a0c10] rounded-lg px-3 border border-[#1e2230]">
        {children}
      </div>
    </div>
  );
}

function PlatformBadge({ platform }: { platform: string }) {
  const p = platform.toLowerCase();
  const s =
    p === "android"
      ? "bg-green-400/10 text-green-400 border-green-400/30"
      : p === "ios"
        ? "bg-slate-400/10 text-slate-200 border-slate-400/30"
        : p.includes("web")
          ? "bg-blue-400/10  text-blue-400  border-blue-400/30"
          : "bg-slate-600/20 text-slate-400 border-slate-600/30";
  return (
    <span
      className={`inline-flex px-2.5 py-0.5 rounded-full border font-mono text-[10px] uppercase font-bold ${s}`}
    >
      {platform || "unknown"}
    </span>
  );
}

export default function DevicePanel({
  device,
  details,
  historyCount,
  historyLoading,
  onClose,
}: Props) {
  const summary = device.infos?.summary ?? {};
  const platform = (details?.platform ?? summary.platform ?? "").toLowerCase();
  const displayName = device.infos?.display_name ?? device.device_id;
  const lastSeen = new Date(device.timestamp).toLocaleString();
  const info = { ...summary, ...details };

  return (
    <aside className="w-[340px] flex-shrink-0 flex flex-col bg-[#111318] border-l border-[#1e2230] overflow-hidden">
      {/* Header */}
      <div className="px-5 py-4 border-b border-[#1e2230] flex items-start justify-between gap-3 flex-shrink-0">
        <div className="min-w-0">
          <p className="font-mono text-[10px] tracking-widest uppercase text-slate-500 mb-0.5">
            Device Detail
          </p>
          <p className="text-base font-medium text-white truncate">
            {displayName}
          </p>
          <p className="font-mono text-[10px] text-cyan-400 mt-0.5 truncate">
            {device.device_id}
          </p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="text-slate-500 hover:text-white text-xl leading-none mt-0.5 transition-colors flex-shrink-0"
        >
          ✕
        </button>
      </div>

      {/* History status bar */}
      <div className="px-5 py-2.5 border-b border-[#1e2230] flex items-center gap-2 flex-shrink-0 bg-[#0d1017]">
        {historyLoading ? (
          <>
            <span className="w-3 h-3 border border-cyan-400 border-t-transparent rounded-full animate-spin flex-shrink-0" />
            <span className="font-mono text-[10px] text-slate-500">
              Loading location trail…
            </span>
          </>
        ) : (
          <>
            {/* Trail icon */}
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#00e5ff"
              strokeWidth="2.5"
              className="flex-shrink-0"
              aria-labelledby="trail-icon-title"
            >
              <title id="trail-icon-title">Location trail</title>
              <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
            </svg>
            <span className="font-mono text-[10px] text-slate-400">
              Location trail &mdash;&nbsp;
              <span className="text-cyan-400 font-bold">{historyCount}</span>{" "}
              points
            </span>
          </>
        )}
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        <div className="mb-5">
          <p className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 mb-2">
            Platform
          </p>
          <PlatformBadge platform={info.platform ?? "unknown"} />
        </div>

        <Section title="Location">
          <Row label="Latitude" value={device.latitude.toFixed(6)} />
          <Row label="Longitude" value={device.longitude.toFixed(6)} />
          <Row label="Last seen" value={lastSeen} />
        </Section>

        {platform === "android" && (
          <Section title="Hardware">
            <Row label="Manufacturer" value={info.manufacturer} />
            <Row label="Model" value={info.model} />
            <Row label="Brand" value={info.brand} />
            <Row label="Android version" value={info.android_version} />
            <Row label="SDK" value={info.sdk} />
            <Row
              label="Physical device"
              value={
                info.is_physical_device != null
                  ? info.is_physical_device
                    ? "Yes"
                    : "No — Emulator"
                  : null
              }
            />
          </Section>
        )}

        {platform === "ios" && (
          <Section title="Hardware">
            <Row label="Name" value={info.name} />
            <Row label="Model" value={info.model} />
            <Row label="iOS" value={info.system_version} />
            <Row label="Machine" value={info.utsname_machine} />
            <Row
              label="Physical"
              value={
                info.is_physical_device != null
                  ? info.is_physical_device
                    ? "Yes"
                    : "No — Simulator"
                  : null
              }
            />
          </Section>
        )}

        {platform.includes("web") && (
          <Section title="Browser">
            <Row label="Browser" value={info.browser_name} />
            <Row label="Language" value={info.language} />
            <Row label="User agent" value={info.user_agent} />
          </Section>
        )}

        <Section title="System">
          <Row label="OS version" value={info.platform_version} />
          <Row label="Locale" value={info.locale} />
        </Section>

        {platform === "android" &&
          info.supported_abis &&
          info.supported_abis.length > 0 && (
            <div className="mb-5">
              <p className="font-mono text-[10px] tracking-widest uppercase text-cyan-400 mb-2">
                Supported ABIs
              </p>
              <div className="flex flex-wrap gap-1.5">
                {info.supported_abis.map((abi) => (
                  <span
                    key={abi}
                    className="font-mono text-[10px] px-2 py-0.5 rounded border border-cyan-400/20 bg-cyan-400/5 text-cyan-300"
                  >
                    {abi}
                  </span>
                ))}
              </div>
            </div>
          )}
      </div>
    </aside>
  );
}
