"use client";

import React, { useState } from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import { Machine, MachineStatus } from "../../lib/types/scheduler";
import {
  Cpu,
  Plus,
  Trash2,
  Edit2,
  Wrench,
  AlertTriangle,
  CheckCircle2,
  Zap,
  Activity,
  DollarSign,
} from "lucide-react";

export default function MachinesPage() {
  const { machines, addMachine, updateMachine, deleteMachine, generateSchedule, metrics } = useProduction();

  const [isAddOpen, setIsAddOpen] = useState(false);
  const [newId, setNewId] = useState("");
  const [newName, setNewName] = useState("");
  const [newType, setNewType] = useState("Robotic Workstation");
  const [newSpeed, setNewSpeed] = useState(1.0);
  const [newCapabilities, setNewCapabilities] = useState("Component Assembly, PCB Placement");
  const [newCost, setNewCost] = useState(55);

  const handleCreateMachine = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newId || !newName) return;

    const caps = newCapabilities
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const m: Machine = {
      id: newId.toUpperCase(),
      name: newName,
      type: newType,
      capabilities: caps,
      processingSpeed: Number(newSpeed),
      status: "AVAILABLE",
      hourlyCost: Number(newCost),
    };

    addMachine(m);
    setNewId("");
    setNewName("");
    setIsAddOpen(false);
    generateSchedule();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-slate-950 border border-slate-800 rounded-2xl p-5 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <h1 className="text-xl font-bold text-slate-100 uppercase tracking-tight">
              Workstation & Robotic Cell Management
            </h1>
          </div>
          <p className="text-xs text-slate-400">
            Configure machine capabilities, speed factors, scheduled maintenance, and hardware parameters
          </p>
        </div>

        <button
          onClick={() => setIsAddOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
        >
          <Plus className="h-4 w-4" />
          Add Workstation
        </button>
      </div>

      {/* Machines Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {machines.map((machine) => {
          const util = metrics.machineUtilizationById[machine.id] || 0;
          const idle = metrics.machineIdleTimeById[machine.id] || 0;

          return (
            <div
              key={machine.id}
              className="p-5 rounded-2xl border border-slate-800 bg-slate-950 shadow-xl flex flex-col justify-between hover:border-slate-700 transition-all"
            >
              <div>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="font-mono font-bold text-sm text-cyan-400">{machine.id}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                      machine.status === "FAILED"
                        ? "bg-rose-950 border-rose-500 text-rose-300"
                        : machine.status === "MAINTENANCE"
                        ? "bg-purple-950 border-purple-500 text-purple-300"
                        : "bg-emerald-950 border-emerald-500 text-emerald-300"
                    }`}
                  >
                    {machine.status}
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-100 mb-1">{machine.name}</h3>
                <p className="text-xs text-slate-400 mb-3">{machine.type}</p>

                {/* Capabilities Badges */}
                <div className="space-y-2 mb-4">
                  <span className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider block">
                    Supported Capabilities
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {machine.capabilities.map((cap, i) => (
                      <span
                        key={i}
                        className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-cyan-300 text-[11px] font-mono"
                      >
                        {cap}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Parameters */}
                <div className="grid grid-cols-3 gap-2 p-3 rounded-xl bg-slate-900/60 border border-slate-800 text-xs font-mono text-slate-300 mb-4">
                  <div>
                    <span className="text-[10px] text-slate-400 block">Speed Factor</span>
                    <strong className="text-slate-100">{machine.processingSpeed}x</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Utilization</span>
                    <strong className="text-emerald-400">{util}%</strong>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">Idle Time</span>
                    <span>{idle}m</span>
                  </div>
                </div>
              </div>

              {/* Card Footer Actions */}
              <div className="flex items-center justify-between pt-3 border-t border-slate-800/80">
                <span className="text-[11px] text-slate-400 font-mono">
                  ${machine.hourlyCost || 50}/hr operational
                </span>
                <button
                  onClick={() => {
                    deleteMachine(machine.id);
                    generateSchedule();
                  }}
                  className="p-1.5 rounded-lg hover:bg-rose-950/80 text-slate-400 hover:text-rose-400 transition-colors text-xs"
                  title="Remove Workstation"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Add Machine Modal */}
      {isAddOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-700 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-slate-100">Add New Factory Workstation</h3>
            <form onSubmit={handleCreateMachine} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Machine ID</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. M7"
                    value={newId}
                    onChange={(e) => setNewId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs uppercase font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Speed Multiplier</label>
                  <input
                    type="number"
                    step="0.1"
                    min="0.5"
                    max="5.0"
                    value={newSpeed}
                    onChange={(e) => setNewSpeed(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs font-mono focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Workstation Name</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. High-Speed Laser Soldering Station"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Supported Capabilities (Comma separated)
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Component Assembly, Soldering, Testing"
                  value={newCapabilities}
                  onChange={(e) => setNewCapabilities(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-cyan-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold shadow"
                >
                  Create Workstation
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

