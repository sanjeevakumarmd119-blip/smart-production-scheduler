"use client";

import React, { useState } from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import { PRESET_SCENARIOS } from "../../lib/presets/presets";
import { Scenario } from "../../lib/types/scheduler";
import {
  Layers,
  Sparkles,
  Play,
  Copy,
  Plus,
  Trash2,
  CheckCircle2,
  Cpu,
  Clock,
  Package,
  Database,
  Download,
  AlertOctagon,
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function ScenariosPage() {
  const router = useRouter();
  const { activeScenario, loadScenario, allScenarios } = useProduction();
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  const categories = ["ALL", "Baseline", "Disruption", "Urgent Insertion", "Maintenance", "Stress Test", "Capacity", "Bottleneck", "Full Demonstration"];

  const filteredScenarios = PRESET_SCENARIOS.filter((s) =>
    selectedCategory === "ALL" ? true : s.category === selectedCategory
  );

  const handleLoadAndSimulate = (sc: Scenario) => {
    loadScenario(sc);
    router.push("/simulator");
  };

  const handleExportJSON = (sc: Scenario) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(sc, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `${sc.id}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Layers className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100 uppercase tracking-tight">
              Factory Scenario Management
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Load realistic predefined presets or create custom production configurations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-mono text-slate-400">
            Active: <strong className="text-cyan-400">{activeScenario.name}</strong>
          </span>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all whitespace-nowrap ${
              selectedCategory === cat
                ? "bg-cyan-500 text-slate-950 font-bold shadow"
                : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Scenarios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-6">
        {filteredScenarios.map((sc) => {
          const isActive = activeScenario.id === sc.id;
          const totalOps = sc.orders.reduce((sum, ord) => sum + ord.operations.length, 0);

          return (
            <div
              key={sc.id}
              className={`p-5 rounded-2xl border transition-all flex flex-col justify-between shadow-xl ${
                isActive
                  ? "bg-slate-900/90 border-cyan-500 ring-1 ring-cyan-500/50 shadow-cyan-950/40"
                  : "bg-slate-950 border-slate-800 hover:border-slate-700"
              }`}
            >
              <div>
                {/* Header & Badges */}
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300">
                    {sc.category}
                  </span>
                  {isActive && (
                    <span className="text-[10px] font-mono font-bold px-2 py-0.5 rounded bg-emerald-950 border border-emerald-500 text-emerald-300 flex items-center gap-1">
                      <CheckCircle2 className="h-3 w-3" /> ACTIVE SCENARIO
                    </span>
                  )}
                </div>

                <h3 className="text-base font-bold text-slate-100 mb-1.5">{sc.name}</h3>
                <p className="text-xs text-slate-400 leading-relaxed mb-4">{sc.description}</p>

                {/* Metadata Badges */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800/80 text-xs text-slate-300 font-mono mb-4">
                  <div className="flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-cyan-400" />
                    <span>{sc.machines.length} Machines</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Package className="h-3.5 w-3.5 text-amber-400" />
                    <span>{sc.orders.length} Orders</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <Clock className="h-3.5 w-3.5 text-indigo-400" />
                    <span>{totalOps} Ops</span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-800/80">
                <button
                  onClick={() => handleExportJSON(sc)}
                  className="p-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-400 hover:text-slate-200 transition-colors text-xs"
                  title="Export Scenario JSON"
                >
                  <Download className="h-4 w-4" />
                </button>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => loadScenario(sc)}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                      isActive
                        ? "bg-slate-800 text-slate-400 cursor-default"
                        : "bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200"
                    }`}
                  >
                    {isActive ? "Loaded" : "Select"}
                  </button>

                  <button
                    onClick={() => handleLoadAndSimulate(sc)}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-md transition-colors"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Simulate
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

