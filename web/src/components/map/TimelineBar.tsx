"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { LocationPoint } from "@/types/device";

interface Props {
  history: LocationPoint[];
  onChange: (visible: LocationPoint[]) => void;
  windowHours: number | "all" | "custom";
  onWindowHoursChange: (w: number | "all" | "custom") => void;
  customHours: number;
  onCustomHoursChange: (h: number) => void;
}

const PLAY_INTERVAL_MS = 50;

export default function TimelineBar({
  history,
  onChange,
  windowHours,
  onWindowHoursChange,
  customHours,
  onCustomHoursChange,
}: Props) {
  const [draftCustom, setDraftCustom] = useState<number>(12);
  const [inPct, setInPct] = useState(0); // left trim handle 0–100
  const [outPct, setOutPct] = useState(100); // right trim handle 0–100
  const [headPct, setHeadPct] = useState(100); // playhead 0–100
  const [playing, setPlaying] = useState(false);

  const trackRef = useRef<HTMLDivElement>(null);
  const playRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const dragging = useRef<"in" | "out" | "head" | null>(null);

  // ── Windowed subset ─────────────────────────────────────────────────────────
  const windowed = useMemo(() => {
    if (history.length === 0) return [];
    const sorted = [...history].sort((a, b) => a.timestamp - b.timestamp);
    if (windowHours === "all") return sorted;
    const newest = sorted[sorted.length - 1].timestamp;
    const hours = windowHours === "custom" ? customHours : windowHours;
    const cutoff = newest - hours * 3_600_000;
    return sorted.filter((p) => p.timestamp >= cutoff);
  }, [history, windowHours, customHours]);

  const minTs = useMemo(
    () => (windowed.length ? windowed[0].timestamp : 0),
    [windowed],
  );
  const maxTs = useMemo(
    () => (windowed.length ? windowed[windowed.length - 1].timestamp : 1),
    [windowed],
  );
  const span = useMemo(() => maxTs - minTs || 1, [minTs, maxTs]);

  const pctToTs = useCallback(
    (pct: number) => minTs + (pct / 100) * span,
    [minTs, span],
  );
  const tsToPct = (ts: number) => ((ts - minTs) / span) * 100;

  const fmt = (ts: number) =>
    new Date(ts).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

  const fmtFull = (ts: number) =>
    new Date(ts).toLocaleDateString([], { month: "short", day: "numeric" }) +
    " " +
    new Date(ts).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
    });

  // ── Emit visible points (between in and playhead) ───────────────────────────
  useEffect(() => {
    if (windowed.length === 0) {
      onChange([]);
      return;
    }
    const from = pctToTs(inPct);
    const to = pctToTs(headPct);
    onChange(windowed.filter((p) => p.timestamp >= from && p.timestamp <= to));
  }, [headPct, inPct, windowed, pctToTs, onChange]);

  // ── Drag handling ───────────────────────────────────────────────────────────
  const pctFromEvent = useCallback((e: MouseEvent | TouchEvent) => {
    if (!trackRef.current) return 0;
    const rect = trackRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    return Math.max(
      0,
      Math.min(100, ((clientX - rect.left) / rect.width) * 100),
    );
  }, []);

  useEffect(() => {
    const onMove = (e: MouseEvent | TouchEvent) => {
      if (!dragging.current) return;
      const pct = pctFromEvent(e);
      if (dragging.current === "in") {
        setInPct(Math.min(pct, outPct - 1));
        setHeadPct((h) => Math.max(pct, h));
      } else if (dragging.current === "out") {
        setOutPct(Math.max(pct, inPct + 1));
      } else if (dragging.current === "head") {
        setHeadPct(Math.max(inPct, Math.min(outPct, pct)));
      }
    };
    const onUp = () => {
      dragging.current = null;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    window.addEventListener("touchmove", onMove);
    window.addEventListener("touchend", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
      window.removeEventListener("touchmove", onMove);
      window.removeEventListener("touchend", onUp);
    };
  }, [inPct, outPct, pctFromEvent]);

  // ── Play ────────────────────────────────────────────────────────────────────
  const stopPlay = useCallback(() => {
    if (playRef.current) {
      clearInterval(playRef.current);
      playRef.current = null;
    }
    setPlaying(false);
  }, []);

  const startPlay = useCallback(() => {
    const startFrom = headPct >= outPct ? inPct : headPct;
    setHeadPct(startFrom);
    setPlaying(true);
    const rangeSpan = outPct - inPct;
    // advance ~1% of range per tick → full sweep in ~rangeSpan * 50ms
    const step = rangeSpan / 120;
    playRef.current = setInterval(() => {
      setHeadPct((prev) => {
        const next = prev + step;
        if (next >= outPct) {
          stopPlay();
          return outPct;
        }
        return next;
      });
    }, PLAY_INTERVAL_MS);
  }, [headPct, inPct, outPct, stopPlay]);

  useEffect(() => () => stopPlay(), [stopPlay]);

  // Reset handles when window changes
  useEffect(() => {
    setInPct(0);
    setOutPct(100);
    setHeadPct(100);
    stopPlay();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stopPlay]);

  if (history.length === 0) return null;

  // ── Tick marks ──────────────────────────────────────────────────────────────
  const tickCount = 6;
  const ticks = Array.from({ length: tickCount + 1 }, (_, i) => {
    const pct = (i / tickCount) * 100;
    const ts = pctToTs(pct);
    return { pct, label: fmt(ts) };
  });

  // Point dots positions
  const dotPcts = windowed.map((p) => tsToPct(p.timestamp));

  // Current playhead timestamp
  const headTs = pctToTs(headPct);

  return (
    <div
      className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[1000] w-[min(720px,calc(100%-80px))]
        bg-[#0d1017]/95 border border-[#1e2230] rounded-xl backdrop-blur-md
        px-5 py-3.5 flex flex-col gap-3 shadow-[0_8px_40px_rgba(0,0,0,.7)]"
    >
      {/* ── Top bar: play + time display + window ── */}
      <div className="flex items-center gap-3">
        {/* Play/Pause */}
        <button
          type="button"
          onClick={playing ? stopPlay : startPlay}
          className="w-7 h-7 rounded-full border border-[#1e2230] flex items-center justify-center
            hover:border-cyan-500 hover:text-cyan-400 transition-colors flex-shrink-0 text-slate-400"
        >
          {playing ? (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
              <title>Pause</title>
              <rect x="0.5" y="0.5" width="3" height="8" rx="0.5" />
              <rect x="5.5" y="0.5" width="3" height="8" rx="0.5" />
            </svg>
          ) : (
            <svg width="9" height="9" viewBox="0 0 9 9" fill="currentColor">
              <title>Play</title>
              <polygon points="1,0.5 9,4.5 1,8.5" />
            </svg>
          )}
        </button>

        {/* Current playhead time */}
        <div className="flex items-baseline gap-1.5">
          <span className="font-mono text-sm text-cyan-400 font-bold tabular-nums">
            {fmtFull(headTs)}
          </span>
          <span className="font-mono text-[9px] text-slate-600">
            /{fmtFull(pctToTs(outPct))}
          </span>
        </div>

        <div className="flex-1" />

        {/* Window selector */}
        <div className="flex gap-1 items-center flex-wrap">
          <span className="font-mono text-[9px] text-slate-600 uppercase tracking-widest mr-1">
            Window
          </span>
          {([1, 4, 8, 24, 48, "all", "custom"] as const).map((h) => (
            <button
              key={String(h)}
              type="button"
              onClick={() => {
                onWindowHoursChange(h);
                stopPlay();
                setInPct(0);
                setOutPct(100);
                setHeadPct(100);
              }}
              className={`font-mono text-[9px] px-1.5 py-0.5 rounded border transition-colors ${
                windowHours === h
                  ? "border-cyan-500 bg-cyan-500/10 text-cyan-300"
                  : "border-[#1e2230] text-slate-500 hover:border-cyan-500/40 hover:text-slate-300"
              }`}
            >
              {h === "all" ? "All" : h === "custom" ? "Custom" : `${h}h`}
            </button>
          ))}

          {/* Custom input — only shown when custom is selected */}
          {windowHours === "custom" && (
            <div className="flex items-center gap-1 ml-1">
              <input
                type="number"
                min={1}
                max={8760}
                value={draftCustom}
                onChange={(e) => setDraftCustom(Number(e.target.value))}
                onBlur={() => {
                  const val = Math.max(1, Math.min(8760, draftCustom));
                  setDraftCustom(val);
                  onCustomHoursChange(val);
                  setInPct(0);
                  setOutPct(100);
                  setHeadPct(100);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter") (e.target as HTMLInputElement).blur();
                }}
                className="w-14 font-mono text-[9px] px-1.5 py-0.5 rounded border border-[#1e2230]
          bg-[#0a0c10] text-cyan-300 text-center focus:outline-none focus:border-cyan-500
          [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none
          [&::-webkit-inner-spin-button]:appearance-none"
              />
              <span className="font-mono text-[9px] text-slate-600">h</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Track ── */}
      <div className="flex flex-col gap-1 select-none">
        {/* Tick labels */}
        <div className="relative h-3">
          {ticks.map(({ pct, label }) => (
            <span
              key={pct}
              className="absolute font-mono text-[8px] text-slate-600 -translate-x-1/2"
              style={{ left: `${pct}%` }}
            >
              {label}
            </span>
          ))}
        </div>

        {/* Main track area */}
        <div
          ref={trackRef}
          role="slider"
          aria-label="Playhead position"
          aria-valuenow={Math.round(headPct)}
          aria-valuemin={0}
          aria-valuemax={100}
          tabIndex={0}
          className="relative h-9 rounded-md overflow-visible cursor-crosshair"
          onClick={(e) => {
            if (dragging.current) return;
            const rect = trackRef.current?.getBoundingClientRect();
            if (!rect) return;
            const pct = Math.max(
              0,
              Math.min(100, ((e.clientX - rect.left) / rect.width) * 100),
            );
            setHeadPct(Math.max(inPct, Math.min(outPct, pct)));
          }}
          onKeyDown={(e) => {
            if (e.key === "ArrowRight")
              setHeadPct((p) => Math.min(outPct, p + 1));
            if (e.key === "ArrowLeft")
              setHeadPct((p) => Math.max(inPct, p - 1));
          }}
        >
          {/* Base rail */}
          <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-2 bg-[#1e2230] rounded-full" />

          {/* Out-of-range dim overlays */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 bg-[#0a0c10]/80 rounded-l-full"
            style={{ left: 0, width: `${inPct}%` }}
          />
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 bg-[#0a0c10]/80 rounded-r-full"
            style={{ left: `${outPct}%`, right: 0 }}
          />

          {/* Active range highlight */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 bg-cyan-900/60 border-t border-b border-cyan-500/30"
            style={{ left: `${inPct}%`, width: `${outPct - inPct}%` }}
          />

          {/* Played portion (in → head) */}
          <div
            className="absolute top-1/2 -translate-y-1/2 h-2 bg-cyan-500/50"
            style={{
              left: `${inPct}%`,
              width: `${Math.max(0, headPct - inPct)}%`,
            }}
          />

          {/* Data point dots */}
          {dotPcts.map((pct, i) => (
            <div
              key={windowed[i].timestamp}
              className="absolute top-1/2 -translate-y-1/2 w-[2px] h-3 bg-cyan-400/40 rounded-full pointer-events-none"
              style={{ left: `${pct}%` }}
            />
          ))}

          {/* ── In handle (left bracket) ── */}
          <div
            role="slider"
            aria-label="In point"
            aria-valuenow={Math.round(inPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            className="absolute top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize z-20 group"
            style={{ left: `${inPct}%`, transform: "translateX(-50%)" }}
            onMouseDown={() => {
              dragging.current = "in";
            }}
            onTouchStart={() => {
              dragging.current = "in";
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight")
                setInPct((p) => Math.min(p + 1, outPct - 1));
              if (e.key === "ArrowLeft") setInPct((p) => Math.max(0, p - 1));
            }}
          >
            <div className="w-[3px] h-full bg-cyan-400 rounded-full group-hover:bg-cyan-300 transition-colors" />
            {/* bracket top cap */}
            <div className="absolute top-0 left-[3px] w-2.5 h-[3px] bg-cyan-400 rounded-sm group-hover:bg-cyan-300 transition-colors" />
            <div className="absolute bottom-0 left-[3px] w-2.5 h-[3px] bg-cyan-400 rounded-sm group-hover:bg-cyan-300 transition-colors" />
          </div>

          {/* ── Out handle (right bracket) ── */}
          <div
            role="slider"
            aria-label="Out point"
            aria-valuenow={Math.round(outPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            className="absolute top-0 bottom-0 w-3 flex items-center justify-center cursor-ew-resize z-20 group"
            style={{ left: `${outPct}%`, transform: "translateX(-50%)" }}
            onMouseDown={() => {
              dragging.current = "out";
            }}
            onTouchStart={() => {
              dragging.current = "out";
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight")
                setOutPct((p) => Math.min(100, p + 1));
              if (e.key === "ArrowLeft")
                setOutPct((p) => Math.max(inPct + 1, p - 1));
            }}
          >
            <div className="w-[3px] h-full bg-cyan-400 rounded-full group-hover:bg-cyan-300 transition-colors" />
            <div className="absolute top-0 right-[3px] w-2.5 h-[3px] bg-cyan-400 rounded-sm group-hover:bg-cyan-300 transition-colors" />
            <div className="absolute bottom-0 right-[3px] w-2.5 h-[3px] bg-cyan-400 rounded-sm group-hover:bg-cyan-300 transition-colors" />
          </div>

          {/* ── Playhead ── */}
          <div
            role="slider"
            aria-label="Playhead"
            aria-valuenow={Math.round(headPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            className="absolute top-0 bottom-0 w-5 z-30 cursor-ew-resize"
            style={{ left: `${headPct}%`, transform: "translateX(-50%)" }}
            onMouseDown={() => {
              dragging.current = "head";
            }}
            onTouchStart={() => {
              dragging.current = "head";
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight")
                setHeadPct((p) => Math.min(outPct, p + 1));
              if (e.key === "ArrowLeft")
                setHeadPct((p) => Math.max(inPct, p - 1));
            }}
          >
            {/* Diamond head */}
            <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-2.5 h-2.5 bg-white rotate-45 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
          </div>
          {/* Invisible wide hit area for playhead drag */}
          <div
            role="slider"
            aria-label="Playhead"
            aria-valuenow={Math.round(headPct)}
            aria-valuemin={0}
            aria-valuemax={100}
            tabIndex={0}
            className="absolute top-0 bottom-0 w-5 z-30 cursor-ew-resize"
            style={{ left: `${headPct}%`, transform: "translateX(-50%)" }}
            onMouseDown={() => {
              dragging.current = "head";
            }}
            onTouchStart={() => {
              dragging.current = "head";
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight")
                setHeadPct((p) => Math.min(outPct, p + 1));
              if (e.key === "ArrowLeft")
                setHeadPct((p) => Math.max(inPct, p - 1));
            }}
          />
        </div>

        {/* In/out time labels */}
        <div className="relative h-3">
          <span
            className="absolute font-mono text-[8px] text-cyan-500/70 -translate-x-1/2"
            style={{ left: `${inPct}%` }}
          >
            {fmt(pctToTs(inPct))}
          </span>
          <span
            className="absolute font-mono text-[8px] text-cyan-500/70 -translate-x-1/2"
            style={{ left: `${outPct}%` }}
          >
            {fmt(pctToTs(outPct))}
          </span>
        </div>
      </div>
    </div>
  );
}
