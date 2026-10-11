"use client";

import React from "react";
import Link from "next/link";
import { useProduction } from "../../lib/context/ProductionContext";
import { KPICards } from "../../components/dashboard/KPICards";
import { MachineStatusGrid } from "../../components/dashboard/MachineStatusGrid";
import { BottleneckCard } from "../../components/dashboard/BottleneckCard";
import { GanttChart } from "../../components/gantt/GanttChart";
import {
  Activity,
  PlaySquare,
  Sparkles,
  RefreshCw,
  Clock,
  Layers,
  Flame,
  ArrowRight,
} from "lucide-react";

export default function DashboardPage() {
  const {
    activeScenario,
    machines,
    orders,
    scheduleEntries,
    currentTime,
    simulationStatus,
    formattedTime,
    lastRescheduleComparison,
  } = useProduction();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100 tracking-tight uppercase">
              Production Scheduling & Control Dashboard
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Real-time shop-floor telemetry for <strong className="text-slate-200">{activeScenario.name}</strong>
          </p>
        </div>

        {/* Action Shortcuts */}
        <div className="flex items-center gap-2">
          <Link
            href="/simulator"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
          >
            <PlaySquare className="h-4 w-4" />
            Open Simulator
          </Link>
          <Link
            href="/demo"
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/20"
          >
            <Sparkles className="h-4 w-4" />
            Viva Demo Mode
          </Link>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <KPICards />

      {/* Main Grid: Machine Status & Bottlenecks */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MachineStatusGrid />
        </div>
        <div className="lg:col-span-1">
          <BottleneckCard />
        </div>
      </div>

      {/* Factory Gantt Timeline Preview */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
            Live Shop Floor Gantt Schedule
          </h2>
          <Link
            href="/simulator"
            className="text-xs text-cyan-400 hover:text-cyan-300 flex items-center gap-1 font-medium transition-colors"
          >
            Full Interactive Controls <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>

        <GanttChart
          machines={machines}
          orders={orders}
          scheduleEntries={scheduleEntries}
          currentTime={currentTime}
        />
      </div>
    </div>
  );
}

