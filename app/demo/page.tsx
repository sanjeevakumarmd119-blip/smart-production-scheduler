"use client";

import React from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import { DemoController } from "../../components/demo/DemoController";
import { GanttChart } from "../../components/gantt/GanttChart";
import { DAGViewer } from "../../components/dag/DAGViewer";
import { KPICards } from "../../components/dashboard/KPICards";
import { Sparkles, PlaySquare, Layers, Activity } from "lucide-react";

export default function DemoPage() {
  const { machines, orders, scheduleEntries, currentTime } = useProduction();

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Demo Guide Controller */}
      <DemoController />

      {/* KPI Cards Snapshot */}
      <KPICards />

      {/* Live Factory Gantt Timeline */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Real-time Shop Floor Timeline Reaction
        </h3>
        <GanttChart
          machines={machines}
          orders={orders}
          scheduleEntries={scheduleEntries}
          currentTime={currentTime}
        />
      </div>

      {/* DAG Dependency Graph */}
      <div className="space-y-3">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Operation Dependency Graph Status
        </h3>
        <DAGViewer
          orders={orders}
          scheduleEntries={scheduleEntries}
          currentTime={currentTime}
        />
      </div>
    </div>
  );
}

