"use client";

import React, { useState } from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import { AnalyticsCharts } from "../../components/analytics/AnalyticsCharts";
import {
  BarChart3,
  Trophy,
  Zap,
  Sliders,
  CheckCircle2,
  Clock,
  Cpu,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from "lucide-react";

export default function ResultsPage() {
  const { metrics, machines, orders, customWeights, updateWeights } = useProduction();
  const [showWeightsConfig, setShowWeightsConfig] = useState(false);

  const breakdown = metrics.scoreBreakdown;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100 uppercase tracking-tight">
              Production Performance Analytics & Results
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Comprehensive multi-attribute metrics, bottleneck diagnosis, and weighted objective evaluation
          </p>
        </div>

        <button
          onClick={() => setShowWeightsConfig((prev) => !prev)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
        >
          <Sliders className="h-4 w-4 text-cyan-400" />
          {showWeightsConfig ? "Hide Objective Weights" : "Configure Score Weights"}
        </button>
      </div>

      {/* Objective Weights Customizer Drawer */}
      {showWeightsConfig && (
        <div className="p-5 bg-slate-900/90 border border-cyan-500/30 rounded-2xl shadow-2xl space-y-4 animate-in fade-in duration-150">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div>
              <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <Zap className="h-4 w-4 text-cyan-400" />
                Weighted Multi-Objective Optimization Function
              </h3>
              <p className="text-xs text-slate-400">
                Tune the objective weights used to calculate the overall schedule score.
              </p>
            </div>
            <button
              onClick={() =>
                updateWeights({
                  completionReward: 100,
                  onTimeReward: 80,
                  priorityMultiplier: 50,
                  utilizationReward: 40,
                  idleTimePenalty: 1.5,
                  delayPenalty: 3.0,
                })
              }
              className="text-xs text-cyan-400 hover:underline flex items-center gap-1"
            >
              <RotateCcw className="h-3 w-3" /> Reset Defaults
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Completion Reward</label>
              <input
                type="number"
                value={customWeights.completionReward}
                onChange={(e) => updateWeights({ completionReward: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">On-Time Reward</label>
              <input
                type="number"
                value={customWeights.onTimeReward}
                onChange={(e) => updateWeights({ onTimeReward: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Priority Weight</label>
              <input
                type="number"
                value={customWeights.priorityMultiplier}
                onChange={(e) => updateWeights({ priorityMultiplier: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Utilization Factor</label>
              <input
                type="number"
                value={customWeights.utilizationReward}
                onChange={(e) => updateWeights({ utilizationReward: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Idle Penalty (/min)</label>
              <input
                type="number"
                step="0.1"
                value={customWeights.idleTimePenalty}
                onChange={(e) => updateWeights({ idleTimePenalty: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs"
              />
            </div>
            <div>
              <label className="text-[11px] text-slate-400 block mb-1">Delay Penalty (/min)</label>
              <input
                type="number"
                step="0.1"
                value={customWeights.delayPenalty}
                onChange={(e) => updateWeights({ delayPenalty: Number(e.target.value) })}
                className="w-full px-2.5 py-1.5 rounded bg-slate-950 border border-slate-700 text-slate-200 font-mono text-xs"
              />
            </div>
          </div>
        </div>
      )}

      {/* Viva Scorecard Hero */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Overall Score Card */}
        <div className="p-5 rounded-2xl bg-cyan-950/40 border border-cyan-500/50 shadow-xl flex flex-col justify-between">
          <div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider block mb-1">
              Overall Schedule Score
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold font-mono text-cyan-300">
              {metrics.overallScheduleScore}
            </div>
          </div>
          <p className="text-[11px] text-slate-400 mt-3 leading-relaxed">
            {breakdown.explanation}
          </p>
        </div>

        {/* Highlight 1: Makespan & Order Lead Time */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Makespan (Total Production Time)
          </span>
          <div className="text-2xl font-bold font-mono text-slate-100">
            {metrics.totalProductionTime} min
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Average order completion: <strong className="text-slate-200">{metrics.averageOrderCompletionTime} min</strong>
          </div>
        </div>

        {/* Highlight 2: On-Time Delivery Rate */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            On-Time Delivery Rate
          </span>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {metrics.totalOrders > 0 ? Math.round((metrics.onTimeOrders / metrics.totalOrders) * 100) : 100}%
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {metrics.onTimeOrders} on time • {metrics.delayedOrders} delayed
          </div>
        </div>

        {/* Highlight 3: Dynamic Rescheduling Count */}
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl flex flex-col justify-between">
          <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
            Adaptive Rescheduling
          </span>
          <div className="text-2xl font-bold font-mono text-indigo-400">
            {metrics.totalReschedulingEvents} Events
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Dynamic disruptions successfully isolated
          </div>
        </div>
      </div>

      {/* Visual Analytics Charts */}
      <AnalyticsCharts />
    </div>
  );
}

