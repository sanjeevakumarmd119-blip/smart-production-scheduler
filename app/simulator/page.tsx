"use client";

import React, { useState } from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import { SimulatorControls } from "../../components/simulator/SimulatorControls";
import { GanttChart } from "../../components/gantt/GanttChart";
import { DAGViewer } from "../../components/dag/DAGViewer";
import { PlaySquare, Layers, Clock, Cpu, BarChart3, AlertOctagon, Sparkles } from "lucide-react";

export default function SimulatorPage() {
  const { machines, orders, scheduleEntries, currentTime } = useProduction();
  const [activeView, setActiveView] = useState<"GANTT" | "DAG" | "BOTH">("BOTH");

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header & View Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <PlaySquare className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100 uppercase tracking-tight">
              Production Simulator & Timeline Engine
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Interactive discrete-time execution with dynamic event injection and live DAG dependency resolution
          </p>
        </div>

        {/* View Toggles */}
        <div className="flex items-center bg-slate-900 border border-slate-800 rounded-xl p-1 gap-1">
          <button
            onClick={() => setActiveView("BOTH")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === "BOTH"
                ? "bg-cyan-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Split View (Gantt + DAG)
          </button>
          <button
            onClick={() => setActiveView("GANTT")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === "GANTT"
                ? "bg-cyan-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            Gantt Timeline
          </button>
          <button
            onClick={() => setActiveView("DAG")}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              activeView === "DAG"
                ? "bg-cyan-500 text-slate-950 shadow"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            DAG Graph
          </button>
        </div>
      </div>

      {/* Simulator Playback Controls Bar */}
      <SimulatorControls />

      {/* Main Visual Panels */}
      <div className="space-y-6">
        {(activeView === "GANTT" || activeView === "BOTH") && (
          <div className="space-y-2">
            <GanttChart
              machines={machines}
              orders={orders}
              scheduleEntries={scheduleEntries}
              currentTime={currentTime}
            />
          </div>
        )}

        {(activeView === "DAG" || activeView === "BOTH") && (
          <div className="space-y-2">
            <DAGViewer
              orders={orders}
              scheduleEntries={scheduleEntries}
              currentTime={currentTime}
            />
          </div>
        )}
      </div>
    </div>
  );
}

