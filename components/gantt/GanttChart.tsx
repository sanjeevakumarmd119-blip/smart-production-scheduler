"use client";

import React, { useState, useMemo } from "react";
import { Machine, Order, ScheduleEntry } from "../../lib/types/scheduler";
import { formatSimulationTime } from "../../lib/simulation/engine";
import {
  ZoomIn,
  ZoomOut,
  Maximize2,
  Info,
  Clock,
  Cpu,
  Layers,
  AlertTriangle,
  Wrench,
  CheckCircle2,
  Play,
} from "lucide-react";

interface GanttChartProps {
  machines: Machine[];
  orders: Order[];
  scheduleEntries: ScheduleEntry[];
  currentTime: number;
  highlightOrderId?: string;
  onSelectOperation?: (entry: ScheduleEntry) => void;
}

export function GanttChart({
  machines,
  orders,
  scheduleEntries,
  currentTime,
  highlightOrderId,
  onSelectOperation,
}: GanttChartProps) {
  const [zoomLevel, setZoomLevel] = useState<number>(1.0); // pixels per minute multiplier (default 5px/min)
  const [selectedEntry, setSelectedEntry] = useState<ScheduleEntry | null>(null);

  // Calculate timeline max minutes
  const maxScheduleTime = useMemo(() => {
    let maxT = 120;
    for (const e of scheduleEntries) {
      if (e.endTime > maxT) maxT = e.endTime;
    }
    for (const m of machines) {
      if (m.failures) {
        for (const f of m.failures) {
          if (f.startTime + f.duration > maxT) maxT = f.startTime + f.duration;
        }
      }
      if (m.maintenancePeriods) {
        for (const mp of m.maintenancePeriods) {
          if (mp.endTime > maxT) maxT = mp.endTime;
        }
      }
    }
    return Math.max(maxT + 30, currentTime + 30);
  }, [scheduleEntries, machines, currentTime]);

  const pxPerMin = 6 * zoomLevel;
  const timelineWidth = Math.max(800, maxScheduleTime * pxPerMin);

  // Time grid markers (every 15 or 30 minutes)
  const timeMarkers = useMemo(() => {
    const step = zoomLevel < 0.8 ? 30 : 15;
    const markers: number[] = [];
    for (let t = 0; t <= maxScheduleTime; t += step) {
      markers.push(t);
    }
    return markers;
  }, [maxScheduleTime, zoomLevel]);

  const handleEntryClick = (entry: ScheduleEntry) => {
    setSelectedEntry(entry);
    if (onSelectOperation) {
      onSelectOperation(entry);
    }
  };

  const getEntryColor = (entry: ScheduleEntry) => {
    const ord = orders.find((o) => o.id === entry.orderId);
    const deadline = ord?.deadline || 9999;
    const isLate = entry.endTime > deadline;

    if (currentTime >= entry.endTime) {
      return "bg-emerald-900/80 border-emerald-500/70 text-emerald-200 hover:bg-emerald-800";
    }
    if (currentTime >= entry.startTime && currentTime < entry.endTime) {
      return "bg-cyan-900/90 border-cyan-400 text-cyan-100 shadow-[0_0_12px_rgba(6,182,212,0.4)] animate-pulse hover:bg-cyan-800";
    }
    if (isLate) {
      return "bg-amber-950/80 border-amber-500/70 text-amber-200 hover:bg-amber-900";
    }
    // Priority specific tint
    if (ord?.priority === "CRITICAL") {
      return "bg-rose-950/80 border-rose-500/70 text-rose-200 hover:bg-rose-900";
    }
    if (ord?.priority === "HIGH") {
      return "bg-indigo-950/80 border-indigo-500/70 text-indigo-200 hover:bg-indigo-900";
    }
    return "bg-slate-800/90 border-slate-600 text-slate-200 hover:bg-slate-700";
  };

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-2xl">
      {/* Header & Controls */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Factory Production Timeline (Gantt Schedule)
          </h3>
          <span className="text-xs px-2 py-0.5 rounded bg-slate-800 text-slate-400 font-mono">
            {scheduleEntries.length} Operations Scheduled
          </span>
        </div>

        {/* Zoom Controls & Legend */}
        <div className="flex items-center gap-3">
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded transition-colors"
              title="Zoom Out"
            >
              <ZoomOut className="h-3.5 w-3.5" />
            </button>
            <span className="text-[11px] font-mono text-slate-400 px-2">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
              className="p-1.5 hover:bg-slate-800 text-slate-300 rounded transition-colors"
              title="Zoom In"
            >
              <ZoomIn className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => setZoomLevel(1.0)}
              className="p-1.5 hover:bg-slate-800 text-slate-400 hover:text-slate-200 rounded transition-colors"
              title="Reset Zoom"
            >
              <Maximize2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Color Legend Bar */}
      <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-slate-950/60 border-b border-slate-800/80 text-[11px] text-slate-400">
        <span className="text-slate-500 font-medium">Status Legend:</span>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-emerald-500/80 border border-emerald-400 inline-block" />
          <span>Completed</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-cyan-500/90 border border-cyan-300 inline-block animate-pulse" />
          <span>Running (Live)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-rose-600/70 border border-rose-400 inline-block" />
          <span>Critical Priority</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-amber-500/80 border border-amber-400 inline-block" />
          <span>Delayed / Late</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-hatch-purple border border-purple-500 inline-block" />
          <span>Maintenance</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-2.5 rounded bg-hatch-red border border-rose-500 inline-block" />
          <span>Machine Failure</span>
        </div>
      </div>

      {/* Main Gantt Canvas / Timeline */}
      <div className="relative overflow-x-auto overflow-y-auto max-h-[520px] scrollbar-thin">
        <div className="min-w-full" style={{ width: `${timelineWidth + 240}px` }}>
          {/* Timeline Header (Time Marks) */}
          <div className="sticky top-0 z-20 flex bg-slate-900 border-b border-slate-800 text-slate-400 text-xs font-mono select-none">
            {/* Left Machine Column Header */}
            <div className="sticky left-0 z-30 w-56 flex-shrink-0 px-4 py-2.5 bg-slate-900 border-r border-slate-800 font-semibold text-slate-200">
              Workstation / Machine
            </div>

            {/* Time Grid Ticks */}
            <div className="relative flex-1 h-9">
              {timeMarkers.map((t) => (
                <div
                  key={t}
                  className="absolute top-0 bottom-0 border-l border-slate-800 flex flex-col justify-center pl-1.5"
                  style={{ left: `${t * pxPerMin}px` }}
                >
                  <span className="text-[10px] text-slate-300 font-semibold">
                    {formatSimulationTime(t)}
                  </span>
                  <span className="text-[9px] text-slate-500">T={t}m</span>
                </div>
              ))}

              {/* Current Simulation Time Cursor (Red Line) */}
              <div
                className="absolute top-0 bottom-0 z-30 w-0.5 bg-cyan-400 shadow-[0_0_8px_rgba(6,182,212,0.8)] pointer-events-none"
                style={{ left: `${currentTime * pxPerMin}px`, height: "1000px" }}
              >
                <div className="sticky top-0 -ml-2.5 px-1 py-0.5 rounded bg-cyan-500 text-slate-950 font-bold text-[9px] uppercase shadow">
                  NOW
                </div>
              </div>
            </div>
          </div>

          {/* Machine Rows */}
          {machines.map((machine) => {
            const machineEntries = scheduleEntries.filter((e) => e.machineId === machine.id);
            const isMachineFailed = machine.status === "FAILED";
            const isMachineMaintenance = machine.status === "MAINTENANCE";

            return (
              <div
                key={machine.id}
                className="flex border-b border-slate-800/70 hover:bg-slate-900/30 transition-colors group min-h-[64px]"
              >
                {/* Machine Label Column */}
                <div className="sticky left-0 z-10 w-56 flex-shrink-0 px-4 py-3 bg-slate-950/95 border-r border-slate-800 flex flex-col justify-center">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold text-xs text-slate-200 flex items-center gap-1.5">
                      <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                      {machine.id}
                    </span>
                    <span
                      className={`text-[10px] font-mono px-1.5 py-0.2 rounded border uppercase ${
                        isMachineFailed
                          ? "bg-rose-950 border-rose-500 text-rose-300 animate-pulse"
                          : isMachineMaintenance
                          ? "bg-purple-950 border-purple-500 text-purple-300"
                          : "bg-slate-900 border-slate-700 text-slate-400"
                      }`}
                    >
                      {machine.status}
                    </span>
                  </div>
                  <span className="text-[11px] text-slate-400 truncate mt-0.5">
                    {machine.name}
                  </span>
                  <span className="text-[9px] text-slate-500">
                    Speed: {machine.processingSpeed}x • {machine.capabilities.join(", ")}
                  </span>
                </div>

                {/* Machine Timeline Lane */}
                <div className="relative flex-1 h-16 py-2 bg-slate-950/40">
                  {/* Background Grid Lines */}
                  {timeMarkers.map((t) => (
                    <div
                      key={t}
                      className="absolute top-0 bottom-0 border-l border-slate-900/60 pointer-events-none"
                      style={{ left: `${t * pxPerMin}px` }}
                    />
                  ))}

                  {/* Machine Failure Blocks */}
                  {machine.failures?.map((f) => (
                    <div
                      key={f.id}
                      className="absolute top-2 bottom-2 rounded border border-rose-500/80 bg-hatch-red z-10 flex items-center justify-center text-rose-300 text-[10px] font-mono font-bold px-2 shadow"
                      style={{
                        left: `${f.startTime * pxPerMin}px`,
                        width: `${f.duration * pxPerMin}px`,
                      }}
                      title={`FAILURE: ${f.reason} (${f.duration}m)`}
                    >
                      <AlertTriangle className="h-3 w-3 mr-1 text-rose-400 flex-shrink-0" />
                      <span className="truncate">FAILED ({f.duration}m)</span>
                    </div>
                  ))}

                  {/* Machine Maintenance Blocks */}
                  {machine.maintenancePeriods?.map((mp) => (
                    <div
                      key={mp.id}
                      className="absolute top-2 bottom-2 rounded border border-purple-500/80 bg-hatch-purple z-10 flex items-center justify-center text-purple-300 text-[10px] font-mono font-bold px-2 shadow"
                      style={{
                        left: `${mp.startTime * pxPerMin}px`,
                        width: `${(mp.endTime - mp.startTime) * pxPerMin}px`,
                      }}
                      title={`MAINTENANCE: ${mp.reason} (${mp.endTime - mp.startTime}m)`}
                    >
                      <Wrench className="h-3 w-3 mr-1 text-purple-400 flex-shrink-0" />
                      <span className="truncate">MAINTENANCE</span>
                    </div>
                  ))}

                  {/* Operation Bars */}
                  {machineEntries.map((entry) => {
                    const ord = orders.find((o) => o.id === entry.orderId);
                    const isSelected = selectedEntry?.operationId === entry.operationId;
                    const isHighlighted = highlightOrderId === entry.orderId;
                    const widthPx = Math.max(14, entry.duration * pxPerMin);

                    return (
                      <div
                        key={entry.id}
                        onClick={() => handleEntryClick(entry)}
                        className={`absolute top-2 bottom-2 rounded-md border text-left px-2 py-1 cursor-pointer transition-all z-10 flex flex-col justify-center overflow-hidden select-none ${getEntryColor(
                          entry
                        )} ${
                          isSelected ? "ring-2 ring-cyan-400 scale-[1.02] shadow-xl" : ""
                        } ${
                          isHighlighted ? "ring-2 ring-amber-400" : ""
                        }`}
                        style={{
                          left: `${entry.startTime * pxPerMin}px`,
                          width: `${widthPx}px`,
                        }}
                      >
                        <div className="flex items-center justify-between gap-1">
                          <span className="text-[11px] font-bold truncate">
                            {entry.orderId}
                          </span>
                          <span className="text-[9px] font-mono opacity-80 flex-shrink-0">
                            {entry.duration}m
                          </span>
                        </div>
                        <span className="text-[10px] truncate opacity-90 font-medium">
                          {entry.operationName}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Selected Operation Detail Modal / Inspector Drawer */}
      {selectedEntry && (
        <div className="px-4 py-3 bg-slate-900 border-t border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400">
              <Info className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-100 text-sm">
                  {selectedEntry.orderId} — {selectedEntry.operationName}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[10px]">
                  ID: {selectedEntry.operationId}
                </span>
              </div>
              <p className="text-slate-400 text-[11px] mt-0.5">
                Workstation: <span className="text-cyan-400 font-semibold">{selectedEntry.machineName} ({selectedEntry.machineId})</span> • 
                Window: <span className="font-mono text-slate-200">T={selectedEntry.startTime}m → T={selectedEntry.endTime}m</span> ({selectedEntry.duration} min)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 w-full md:w-auto">
            <div className="bg-slate-950 p-2 rounded border border-slate-800 text-[11px] text-slate-300 max-w-lg">
              <span className="text-slate-500 font-semibold mr-1">Explainability Logic:</span>
              {selectedEntry.explanation || "Scheduled by priority slack evaluation and earliest finish time (EFT) heuristic."}
            </div>
            <button
              onClick={() => setSelectedEntry(null)}
              className="px-3 py-1.5 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 font-medium text-xs transition-colors ml-auto md:ml-0"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

