"use client";

import L from "leaflet";
import type { Device, LocationPoint } from "@/types/device";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

function platformEmoji(platform: string): string {
  const p = platform.toLowerCase();
  if (p === "android") return "🤖";
  if (p === "ios") return "🍎";
  if (p.includes("web")) return "🌐";
  return "📱";
}

function makeIcon(
  platform: string,
  active: boolean,
  selected: boolean,
  hasSelection: boolean,
): L.DivIcon {
  const emoji = platformEmoji(platform);
  const borderColor = active ? "#00e5ff" : "#ff4d6d";
  const glowColor = active ? "rgba(0,229,255,.4)" : "rgba(255,77,109,.5)";
  const bg = active ? "rgba(0,229,255,.12)" : "rgba(255,77,109,.18)";
  const opacity = !hasSelection || selected ? 1 : 0.35;
  return L.divIcon({
    className: "",
    html: `<div style="
        width:38px;height:38px;border-radius:50%;
        border:2px solid ${borderColor};background:${bg};
        box-shadow:0 0 14px ${glowColor};
        display:flex;align-items:center;justify-content:center;
        font-size:18px;cursor:pointer;position:relative;
        opacity:${opacity};">
        ${emoji}
        <span style="position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);
          border:5px solid transparent;border-top-color:${borderColor};"></span>
      </div>`,
    iconSize: [38, 47],
    iconAnchor: [19, 47],
    popupAnchor: [0, -49],
  });
}

function makeHistoryDotIcon(isNewest: boolean): L.DivIcon {
  const color = isNewest ? "#00e5ff" : "#334155";
  const size = isNewest ? 10 : 7;
  return L.divIcon({
    className: "",
    html: `<div style="
        width:${size}px;height:${size}px;border-radius:50%;
        background:${color};border:1.5px solid ${isNewest ? "#00e5ff" : "#475569"};
        box-shadow:${isNewest ? `0 0 8px ${color}` : "none"};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  });
}

interface Props {
  devices: Device[];
  activeId: string | null;
  locationHistory: LocationPoint[];
  onSelect: (deviceId: string) => void;
}

export default function DeviceMap({
  devices,
  activeId,
  locationHistory,
  onSelect,
}: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<Map<string, L.Marker>>(new Map());
  const historyLayerRef = useRef<L.LayerGroup | null>(null);
  const onSelectRef = useRef(onSelect);
  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  // ── Init map ────────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!containerRef.current || mapRef.current) return;

    const map = L.map(containerRef.current, { zoomControl: false }).setView(
      [20, 10],
      2,
    );
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: "© OpenStreetMap contributors",
      maxZoom: 19,
    }).addTo(map);
    L.control.zoom({ position: "topright" }).addTo(map);

    historyLayerRef.current = L.layerGroup().addTo(map);
    mapRef.current = map;
    setTimeout(() => map.invalidateSize(), 100);

    return () => {
      map.remove();
      mapRef.current = null;
      markersRef.current.clear();
    };
  }, []);

  // ── Sync device markers ────────────────────────────────────────────────────
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    const seen = new Set<string>();

    for (const device of devices) {
      const { device_id, location, active } = device;
      if (!location || typeof location !== "object") continue;
      if (
        !Number.isFinite(location.latitude) ||
        !Number.isFinite(location.longitude)
      )
        continue;
      seen.add(device_id);
      const platform = device.summary?.platform ?? "";
      const existing = markersRef.current.get(device_id);

      if (existing) {
        existing.setLatLng([location.latitude, location.longitude]);
        existing.setIcon(
          makeIcon(platform, active, device_id === activeId, activeId !== null),
        );
      } else {
        const marker = L.marker([location.latitude, location.longitude], {
          icon: makeIcon(
            platform,
            active,
            device_id === activeId,
            activeId !== null,
          ),
        })
          .addTo(map)
          .on("click", () => onSelectRef.current(device_id));
        markersRef.current.set(device_id, marker);
      }
    }

    for (const [id, marker] of markersRef.current) {
      if (!seen.has(id)) {
        marker.remove();
        markersRef.current.delete(id);
      }
    }
  }, [devices, activeId]);

  // ── Draw location history ──────────────────────────────────────────────────
  useEffect(() => {
    const layer = historyLayerRef.current;
    if (!layer) return;

    layer.clearLayers();

    if (locationHistory.length === 0) return;

    const map = mapRef.current;
    if (!map) return;

    const sorted = [...locationHistory].sort(
      (a, b) => a.timestamp - b.timestamp,
    );
    const latlngs: L.LatLngTuple[] = sorted.map((p) => [
      p.latitude,
      p.longitude,
    ]);

    for (let i = 1; i < sorted.length; i++) {
      const progress = i / (sorted.length - 1);
      const opacity = 0.15 + progress * 0.75;

      L.polyline(
        [
          [sorted[i - 1].latitude, sorted[i - 1].longitude],
          [sorted[i].latitude, sorted[i].longitude],
        ],
        { color: "#00e5ff", weight: 2, opacity },
      ).addTo(layer);
    }

    const step = Math.max(1, Math.floor(sorted.length / 20));
    sorted.forEach((point, i) => {
      const isNewest = i === sorted.length - 1;
      if (i % step !== 0 && !isNewest) return;

      const dot = L.marker([point.latitude, point.longitude], {
        icon: makeHistoryDotIcon(isNewest),
        zIndexOffset: isNewest ? 100 : 0,
      });

      dot.bindTooltip(new Date(point.timestamp).toLocaleTimeString(), {
        permanent: false,
        direction: "top",
        offset: [0, -6],
        className: "leaflet-history-tooltip",
      });

      dot.addTo(layer);
    });

    map.fitBounds(L.latLngBounds(latlngs), { padding: [60, 60], maxZoom: 19 });
  }, [locationHistory]);

  // ── Fly to active device ───────────────────────────────────────────────────
  useEffect(() => {
    if (!activeId || !mapRef.current) return;
    const map = mapRef.current;
    const device = devices.find((d) => d.device_id === activeId);
    if (!device?.location || typeof device.location !== "object") return;
    const { latitude, longitude } = device.location;

    const timer = setTimeout(() => {
      map.invalidateSize({ animate: false });

      if (locationHistory.length <= 1) {
        map.flyTo([latitude, longitude], 19, { duration: 1.2 });
        return;
      }

      map.flyTo([latitude, longitude], 19, { duration: 1 });

      const onMoveEnd = () => {
        map.off("moveend", onMoveEnd);
        const sorted = [...locationHistory].sort(
          (a, b) => a.timestamp - b.timestamp,
        );
        const bounds = L.latLngBounds(
          sorted.map((p) => [p.latitude, p.longitude] as L.LatLngTuple),
        );
        const mapBounds = map.getBounds();
        if (mapBounds.contains(bounds)) return;
        map.flyToBounds(bounds, {
          padding: [60, 60],
          maxZoom: 19,
          duration: 1.2,
        });
      };

      map.once("moveend", onMoveEnd);
    }, 150);

    return () => clearTimeout(timer);
  }, [activeId, locationHistory, devices.find]);

  return (
    <>
      <style>{`
        .leaflet-tile { filter: brightness(.6) invert(1) contrast(3) hue-rotate(200deg) saturate(.3) brightness(.7); }
        .leaflet-container { background: #1a1f2e !important; }
        .leaflet-history-tooltip {
          background: #111318; border: 1px solid #1e2230; color: #94a3b8;
          font-family: monospace; font-size: 11px; padding: 3px 7px;
          border-radius: 4px; box-shadow: none; white-space: nowrap;
        }
        .leaflet-history-tooltip::before { display: none; }
      `}</style>
      <div
        ref={containerRef}
        style={{ width: "100%", height: "100%", minHeight: "400px" }}
      />
    </>
  );
}
