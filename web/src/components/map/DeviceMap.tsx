"use client";

import type { Device } from "@/types/device";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { useEffect, useRef } from "react";

// Fix Leaflet's default marker icon paths broken by webpack
// delete (L.Icon.Default.prototype as unknown as Record<string, unknown>)._getIconUrl;
// L.Icon.Default.mergeOptions({
//     iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
//     iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
//     shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
// });

function platformEmoji(platform: string): string {
    const p = platform.toLowerCase();
    if (p === "android") return "🤖";
    if (p === "ios") return "🍎";
    if (p.includes("web")) return "🌐";
    return "📱";
}

function makeIcon(platform: string, active: boolean): L.DivIcon {
    const emoji = platformEmoji(platform);
    const borderColor = active ? "#ff4d6d" : "#00e5ff";
    const glowColor = active ? "rgba(255,77,109,.5)" : "rgba(0,229,255,.4)";
    const bg = active ? "rgba(255,77,109,.18)" : "rgba(0,229,255,.12)";

    return L.divIcon({
        className: "",
        html: `
      <div style="
        width:38px;height:38px;border-radius:50%;
        border:2px solid ${borderColor};
        background:${bg};
        box-shadow:0 0 14px ${glowColor};
        display:flex;align-items:center;justify-content:center;
        font-size:18px;cursor:pointer;position:relative;
      ">
        ${emoji}
        <span style="
          position:absolute;bottom:-9px;left:50%;transform:translateX(-50%);
          border:5px solid transparent;
          border-top-color:${borderColor};
        "></span>
      </div>`,
        iconSize: [38, 47],
        iconAnchor: [19, 47],
        popupAnchor: [0, -49],
    });
}

interface Props {
    devices: Device[];
    activeId: string | null;
    onSelect: (deviceId: string) => void;
}

export default function DeviceMap({ devices, activeId, onSelect }: Props) {
    const mapRef = useRef<L.Map | null>(null);
    const markersRef = useRef<Map<string, L.Marker>>(new Map());
    const containerRef = useRef<HTMLDivElement>(null);

    const onSelectRef = useRef(onSelect);
    useEffect(() => { onSelectRef.current = onSelect; }, [onSelect]);

    // Init map once
    useEffect(() => {
        if (!containerRef.current || mapRef.current) return;

        const map = L.map(containerRef.current, {
            zoomControl: false,
            preferCanvas: false
        }).setView([20, 10], 2);

        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
            attribution: "© OpenStreetMap contributors",
            maxZoom: 19,
        }).addTo(map);
        L.control.zoom({ position: "topright" }).addTo(map);

        mapRef.current = map;

        setTimeout(() => map.invalidateSize(), 100);

        return () => {
            map.remove();
            mapRef.current = null;
            markersRef.current.clear();
        };
    }, []);

    // Sync markers when devices or activeId change
    useEffect(() => {
        const map = mapRef.current;
        if (!map) return;

        const seen = new Set<string>();

        for (const device of devices) {
            const { device_id, latitude, longitude } = device;

            if (!Number.isFinite(latitude) || !Number.isFinite(longitude)) {
                continue;
            }

            seen.add(device.device_id);

            const platform = device.infos?.summary?.platform ?? "";
            const isActive = device.device_id === activeId;
            const existing = markersRef.current.get(device.device_id);

            if (existing) {
                existing.setLatLng([latitude, longitude]);
                existing.setIcon(makeIcon(platform, isActive));
            } else {
                const marker = L.marker([latitude, longitude], {
                    icon: makeIcon(platform, isActive),
                })
                    .addTo(map)
                    .on("click", () => onSelect(device.device_id));
                markersRef.current.set(device.device_id, marker);
            }
        }

        // Remove markers for devices no longer in the list
        for (const [id, marker] of markersRef.current) {
            if (!seen.has(id)) {
                marker.remove();
                markersRef.current.delete(id);
            }
        }
    }, [devices, activeId]);

    // Fly to active device
    useEffect(() => {
        if (!activeId || !mapRef.current) return;
        const device = devices.find((d) => d.device_id === activeId);
        if (device) {
            mapRef.current.flyTo([device.latitude, device.longitude], 13, { duration: 1 });
        }
    }, [activeId, devices]);

    return (
        <>
            {/* Leaflet CSS dark-mode override */}
            <style>{`
        .leaflet-tile { filter: brightness(.6) invert(1) contrast(3) hue-rotate(200deg) saturate(.3) brightness(.7); }
        .leaflet-container { background: #1a1f2e !important; }
        .leaflet-container { width: 100%; height: 100%; }
      `}</style>
            <div
                ref={containerRef}
                style={{ width: "100%", height: "100%", minHeight: "400px" }}
            />
        </>
    );
}