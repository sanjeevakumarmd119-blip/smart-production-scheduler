"use client";

import React from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import { Cpu, Activity, AlertTriangle, Wrench, CheckCircle2, Clock } from "lucide-react";

export function MachineStatusGrid() {
  const { machines, scheduleEntries, currentTime, metrics } = useProduction();

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2.5">
        <div className="flex items-center gap-2">
          <Cpu className="h-4 w-4 text-cyan-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Robotic Workstations Status & Live Load
          </h3>
        </div>
        <span className="text-[11px] font-mono text-slate-400">
          {machines.length} Total Units Installed
        </span>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {machines.map((machine) => {
          const util = metrics.machineUtilizationById[machine.id] || 0;
          const idle = metrics.machineIdleTimeById[machine.id] || 0;

          // Find current active entry on this machine
          const activeEntry = scheduleEntries.find(
            (e) => e.machineId === machine.id && currentTime >= e.startTime && currentTime < e.endTime
          );

          const isFailed = machine.status === "FAILED";
          const isMaint = machine.status === "MAINTENANCE";

          let statusBadgeColor = "bg-emerald-950 border-emerald-500 text-emerald-300";
          let statusLabel = "AVAILABLE";

          if (isFailed) {
            statusBadgeColor = "bg-rose-950 border-rose-500 text-rose-300 animate-pulse";
            statusLabel = "FAILED";
          } else if (isMaint) {
            statusBadgeColor = "bg-purple-950 border-purple-500 text-purple-300";
            statusLabel = "MAINTENANCE";
          } else if (activeEntry) {
            statusBadgeColor = "bg-cyan-950 border-cyan-400 text-cyan-300 shadow";
            statusLabel = "BUSY";
          }

          let progressPercent = 0;
          if (activeEntry) {
            const elapsed = currentTime - activeEntry.startTime;
            progressPercent = Math.min(100, Math.max(0, Math.round((elapsed / activeEntry.duration) * 100)));
          }

          return (
            <div
              key={machine.id}
              className={`p-3.5 rounded-xl border transition-all flex flex-col justify-between ${
                isFailed
                  ? "bg-rose-950/20 border-rose-600/50"
                  : isMaint
                  ? "bg-purple-950/20 border-purple-600/50"
                  : activeEntry
                  ? "bg-slate-900/90 border-slate-700 shadow-md"
                  : "bg-slate-950 border-slate-800"
              }`}
            >
              {/* Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-xs text-slate-100 font-mono">
                    {machine.id}
                  </span>
                  <span className="text-[11px] text-slate-300 font-medium truncate max-w-[140px]">
                    {machine.name}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded border uppercase ${statusBadgeColor}`}
                >
                  {statusLabel}
                </span>
              </div>

              {/* Live Operation Status */}
              <div className="my-2 p-2 rounded-lg bg-slate-950/80 border border-slate-800/80 text-[11px]">
                {activeEntry ? (
                  <div>
                    <div className="flex justify-between text-slate-300 font-semibold mb-1">
                      <span className="text-cyan-400 truncate">{activeEntry.orderId}</span>
                      <span className="font-mono text-slate-400">{progressPercent}%</span>
                    </div>
                    <p className="text-slate-400 text-[10px] truncate">{activeEntry.operationName}</p>
                    {/* Progress Bar */}
                    <div className="w-full bg-slate-800 rounded-full h-1.5 mt-1.5 overflow-hidden">
                      <div
                        className="bg-cyan-400 h-1.5 rounded-full transition-all duration-300"
                        style={{ width: `${progressPercent}%` }}
                      />
                    </div>
                  </div>
                ) : isFailed ? (
                  <div className="text-rose-400 flex items-center gap-1.5 text-[10px]">
                    <AlertTriangle className="h-3 w-3 flex-shrink-0" />
                    <span>Workstation offline. Awaiting technician.</span>
                  </div>
                ) : isMaint ? (
                  <div className="text-purple-400 flex items-center gap-1.5 text-[10px]">
                    <Wrench className="h-3 w-3 flex-shrink-0" />
                    <span>Calibration service active.</span>
                  </div>
                ) : (
                  <div className="text-slate-500 text-[10px] flex items-center gap-1">
                    <CheckCircle2 className="h-3 w-3 text-slate-600" />
                    <span>Idle • Ready for dispatch</span>
                  </div>
                )}
              </div>

              {/* Machine Telemetry Footer */}
              <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1 border-t border-slate-800/50">
                <span>Speed: <strong className="text-slate-200">{machine.processingSpeed}x</strong></span>
                <span>Util: <strong className="text-emerald-400">{util}%</strong></span>
                <span>Idle: {idle}m</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

