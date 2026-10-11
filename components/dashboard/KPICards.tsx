"use client";

import React from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import {
  Package,
  CheckCircle2,
  AlertCircle,
  Cpu,
  AlertTriangle,
  Activity,
  Clock,
  Zap,
  ShieldCheck,
  Flame,
} from "lucide-react";

export function KPICards() {
  const { metrics, machines, simulationStatus } = useProduction();

  const activeCount = machines.filter((m) => m.status === "AVAILABLE" || m.status === "BUSY").length;
  const failedCount = machines.filter((m) => m.status === "FAILED").length;
  const maintCount = machines.filter((m) => m.status === "MAINTENANCE").length;

  const cards = [
    {
      label: "Total Orders",
      value: metrics.totalOrders,
      subtext: `${metrics.completedOrders} completed • ${metrics.onTimeOrders} on time`,
      icon: Package,
      color: "text-blue-400",
      bgColor: "bg-blue-950/40 border-blue-500/30",
    },
    {
      label: "Completed Orders",
      value: metrics.completedOrders,
      subtext: `${metrics.totalOrders > 0 ? Math.round((metrics.completedOrders / metrics.totalOrders) * 100) : 0}% fulfillment rate`,
      icon: CheckCircle2,
      color: "text-emerald-400",
      bgColor: "bg-emerald-950/40 border-emerald-500/30",
    },
    {
      label: "Delayed Orders",
      value: metrics.delayedOrders,
      subtext: metrics.delayedOrders > 0 ? "Deadline breach detected" : "All orders within deadline",
      icon: AlertCircle,
      color: metrics.delayedOrders > 0 ? "text-rose-400" : "text-slate-400",
      bgColor: metrics.delayedOrders > 0 ? "bg-rose-950/40 border-rose-500/30" : "bg-slate-900/40 border-slate-800",
    },
    {
      label: "Active Workstations",
      value: `${activeCount}/${machines.length}`,
      subtext: failedCount > 0 ? `${failedCount} failed • ${maintCount} maintenance` : `${maintCount} in maintenance`,
      icon: Cpu,
      color: failedCount > 0 ? "text-amber-400" : "text-cyan-400",
      bgColor: "bg-cyan-950/40 border-cyan-500/30",
    },
    {
      label: "Factory Utilization",
      value: `${metrics.averageMachineUtilization}%`,
      subtext: `Target: ≥85% efficiency`,
      icon: Activity,
      color: "text-emerald-400",
      bgColor: "bg-emerald-950/40 border-emerald-500/30",
    },
    {
      label: "Total Idle Time",
      value: `${metrics.totalIdleTime} min`,
      subtext: "Across all active lanes",
      icon: Clock,
      color: "text-indigo-400",
      bgColor: "bg-indigo-950/40 border-indigo-500/30",
    },
    {
      label: "Scheduling Conflicts",
      value: metrics.schedulingConflicts,
      subtext: metrics.schedulingConflicts === 0 ? "0 overlaps (Strictly feasible)" : "Clashes detected",
      icon: ShieldCheck,
      color: metrics.schedulingConflicts === 0 ? "text-emerald-400" : "text-rose-400",
      bgColor: "bg-slate-900/60 border-slate-800",
    },
    {
      label: "Schedule Quality Score",
      value: `${metrics.overallScheduleScore}`,
      subtext: `Weighted Multi-Objective`,
      icon: Zap,
      color: "text-cyan-300",
      bgColor: "bg-cyan-950/50 border-cyan-500/50 shadow-[0_0_15px_rgba(6,182,212,0.15)]",
      highlight: true,
    },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-4 gap-3">
      {cards.map((card, idx) => {
        const Icon = card.icon;
        return (
          <div
            key={idx}
            className={`p-3.5 rounded-xl border flex flex-col justify-between transition-all hover:scale-[1.01] ${card.bgColor}`}
          >
            <div className="flex items-center justify-between gap-2">
              <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider truncate">
                {card.label}
              </span>
              <Icon className={`h-4 w-4 ${card.color} flex-shrink-0`} />
            </div>

            <div className="my-1.5">
              <span className={`text-xl sm:text-2xl font-bold font-mono tracking-tight ${card.color}`}>
                {card.value}
              </span>
            </div>

            <div className="text-[10px] text-slate-400 truncate">
              {card.subtext}
            </div>
          </div>
        );
      })}
    </div>
  );
}

