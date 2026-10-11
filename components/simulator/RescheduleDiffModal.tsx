"use client";

import React from "react";
import { RescheduleComparison } from "../../lib/types/scheduler";
import {
  X,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  CheckCircle2,
  Clock,
  Cpu,
  AlertTriangle,
  ArrowRight,
} from "lucide-react";

interface RescheduleDiffModalProps {
  isOpen: boolean;
  onClose: () => void;
  comparison: RescheduleComparison;
}

export function RescheduleDiffModal({
  isOpen,
  onClose,
  comparison,
}: RescheduleDiffModalProps) {
  if (!isOpen || !comparison) return null;

  const { before, after, delta, explanation, affectedOrders, reassignedOperations, triggerReason } =
    comparison;

  const isScoreImproved = delta.scoreDiff >= 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/90">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-indigo-950 border border-indigo-500/40 text-indigo-400">
              <RefreshCw className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-100 flex items-center gap-2">
                Dynamic Rescheduling Impact Report
                <span className="text-xs px-2 py-0.5 rounded bg-indigo-900/60 border border-indigo-500/40 text-indigo-300 font-mono">
                  T={comparison.timestamp}m
                </span>
              </h3>
              <p className="text-xs text-slate-400">
                Disruption Trigger: <span className="text-slate-200 font-medium">{triggerReason}</span>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded-lg hover:bg-slate-800 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[75vh] overflow-y-auto">
          {/* Executive Summary Banner */}
          <div
            className={`p-4 rounded-xl border flex items-start gap-3 text-xs leading-relaxed ${
              isScoreImproved
                ? "bg-emerald-950/30 border-emerald-500/40 text-emerald-200"
                : "bg-cyan-950/30 border-cyan-500/40 text-cyan-200"
            }`}
          >
            <CheckCircle2 className="h-5 w-5 text-emerald-400 flex-shrink-0 mt-0.5" />
            <div>
              <span className="font-bold text-sm block mb-1">
                Intelligent Disruption Isolation & Schedule Adaptation
              </span>
              {explanation}
            </div>
          </div>

          {/* Comparison Metrics Grid */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Performance Metrics: Original vs Updated Schedule
            </h4>

            <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-800 bg-slate-900/80 text-slate-400 font-mono">
                    <th className="py-3 px-4">Metric Indicator</th>
                    <th className="py-3 px-4">Original Schedule</th>
                    <th className="py-3 px-4">Updated Schedule</th>
                    <th className="py-3 px-4">Net Variance (Δ)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
                  {/* Schedule Score */}
                  <tr className="hover:bg-slate-900/30 font-bold bg-slate-900/20">
                    <td className="py-3 px-4 text-slate-100 flex items-center gap-1.5 font-sans">
                      Schedule Quality Score
                    </td>
                    <td className="py-3 px-4 text-slate-400">{before.scheduleScore} pts</td>
                    <td className="py-3 px-4 text-cyan-300">{after.scheduleScore} pts</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                          delta.scoreDiff >= 0
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                            : "bg-amber-950 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {delta.scoreDiff >= 0 ? "+" : ""}
                        {delta.scoreDiff} pts
                      </span>
                    </td>
                  </tr>

                  {/* Makespan */}
                  <tr className="hover:bg-slate-900/30">
                    <td className="py-3 px-4 text-slate-200 font-sans">Total Makespan (Completion)</td>
                    <td className="py-3 px-4 text-slate-400">{before.makespan} min</td>
                    <td className="py-3 px-4 text-slate-200">{after.makespan} min</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                          delta.makespanDiff <= 0
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                            : "bg-amber-950 text-amber-300 border border-amber-500/40"
                        }`}
                      >
                        {delta.makespanDiff >= 0 ? "+" : ""}
                        {delta.makespanDiff} min
                      </span>
                    </td>
                  </tr>

                  {/* Delayed Orders */}
                  <tr className="hover:bg-slate-900/30">
                    <td className="py-3 px-4 text-slate-200 font-sans">Delayed Orders</td>
                    <td className="py-3 px-4 text-slate-400">{before.delayedOrders}</td>
                    <td className="py-3 px-4 text-slate-200">{after.delayedOrders}</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                          delta.delayedOrdersDiff <= 0
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                            : "bg-rose-950 text-rose-300 border border-rose-500/40"
                        }`}
                      >
                        {delta.delayedOrdersDiff >= 0 ? "+" : ""}
                        {delta.delayedOrdersDiff}
                      </span>
                    </td>
                  </tr>

                  {/* Total Idle Time */}
                  <tr className="hover:bg-slate-900/30">
                    <td className="py-3 px-4 text-slate-200 font-sans">Machine Total Idle Time</td>
                    <td className="py-3 px-4 text-slate-400">{before.totalIdleTime} min</td>
                    <td className="py-3 px-4 text-slate-200">{after.totalIdleTime} min</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                          delta.idleTimeDiff <= 0
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                            : "bg-slate-800 text-slate-300"
                        }`}
                      >
                        {delta.idleTimeDiff >= 0 ? "+" : ""}
                        {delta.idleTimeDiff} min
                      </span>
                    </td>
                  </tr>

                  {/* Machine Utilization */}
                  <tr className="hover:bg-slate-900/30">
                    <td className="py-3 px-4 text-slate-200 font-sans">Avg Machine Utilization</td>
                    <td className="py-3 px-4 text-slate-400">{before.averageUtilization}%</td>
                    <td className="py-3 px-4 text-slate-200">{after.averageUtilization}%</td>
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[11px] ${
                          delta.utilizationDiff >= 0
                            ? "bg-emerald-950 text-emerald-300 border border-emerald-500/40"
                            : "bg-amber-950 text-amber-300"
                        }`}
                      >
                        {delta.utilizationDiff >= 0 ? "+" : ""}
                        {delta.utilizationDiff}%
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          {/* Rerouted Operations & Affected Orders */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-semibold text-slate-300 block mb-2">
                Affected Orders ({affectedOrders.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {affectedOrders.length > 0 ? (
                  affectedOrders.map((ordId) => (
                    <span
                      key={ordId}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-cyan-300 font-mono text-[11px]"
                    >
                      {ordId}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">None directly delayed.</span>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
              <span className="font-semibold text-slate-300 block mb-2">
                Reassigned Operations ({reassignedOperations.length}):
              </span>
              <div className="flex flex-wrap gap-1.5">
                {reassignedOperations.length > 0 ? (
                  reassignedOperations.map((opId) => (
                    <span
                      key={opId}
                      className="px-2 py-1 rounded bg-slate-900 border border-slate-700 text-amber-300 font-mono text-[11px]"
                    >
                      {opId}
                    </span>
                  ))
                ) : (
                  <span className="text-slate-500">Zero operations required reassignment.</span>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end px-6 py-3 border-t border-slate-800 bg-slate-950">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs shadow-lg shadow-cyan-600/20 transition-colors"
          >
            Acknowledge & Continue Simulation
          </button>
        </div>
      </div>
    </div>
  );
}

