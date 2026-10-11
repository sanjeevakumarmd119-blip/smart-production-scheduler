"use client";

import React from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import { AlertOctagon, TrendingUp, Cpu, CheckCircle2, Zap } from "lucide-react";

export function BottleneckCard() {
  const { metrics, machines } = useProduction();

  const bottleneck = metrics.criticalBottleneck;

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl">
      <div className="flex items-center justify-between mb-3 border-b border-slate-800 pb-2">
        <div className="flex items-center gap-2">
          <AlertOctagon className="h-4 w-4 text-amber-400" />
          <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
            Automated Bottleneck & Constraint Detection
          </h3>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-950/60 border border-amber-500/40 text-amber-300">
          TOC Heuristic
        </span>
      </div>

      {bottleneck ? (
        <div className="p-3.5 rounded-xl bg-amber-950/20 border border-amber-600/40 space-y-2.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="font-bold text-amber-300 flex items-center gap-1.5 text-sm">
              <Cpu className="h-4 w-4" />
              {bottleneck.machineName} ({bottleneck.machineId})
            </span>
            <span className="px-2 py-0.5 rounded bg-amber-900/60 text-amber-200 font-mono text-[11px] font-bold">
              Queue Wait: {bottleneck.queueWaitMinutes} min
            </span>
          </div>

          <p className="text-slate-300 leading-relaxed text-[11px]">
            {bottleneck.reason}
          </p>

          <div className="p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400">
            <strong className="text-cyan-400">Recommended Optimization:</strong> Consider load balancing downstream testing or provisioning secondary parallel workstation to alleviate queue congestion.
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 text-xs flex items-center gap-2.5">
          <CheckCircle2 className="h-4 w-4 text-emerald-400 flex-shrink-0" />
          <span>No critical bottlenecks detected. Production flow is balanced across workstations.</span>
        </div>
      )}

      {/* Top Performing Workstation Highlight */}
      <div className="mt-3 pt-3 border-t border-slate-800/80 grid grid-cols-2 gap-2 text-xs">
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">Peak Utilization Unit</span>
          <span className="font-semibold text-slate-200 text-[11px] truncate block mt-0.5">
            {metrics.bestPerformingMachine.name} ({metrics.bestPerformingMachine.utilization}%)
          </span>
        </div>
        <div className="p-2 rounded-lg bg-slate-900/60 border border-slate-800/80">
          <span className="text-[10px] text-slate-500 block uppercase">Highest Workload</span>
          <span className="font-semibold text-slate-200 text-[11px] truncate block mt-0.5">
            {metrics.mostLoadedMachine.name} ({metrics.mostLoadedMachine.workloadMinutes}m)
          </span>
        </div>
      </div>
    </div>
  );
}

