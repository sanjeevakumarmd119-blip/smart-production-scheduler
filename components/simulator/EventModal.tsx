"use client";

import React, { useState } from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import {
  AlertTriangle,
  Wrench,
  Flame,
  Clock,
  CheckCircle,
  X,
  Plus,
  Cpu,
  Layers,
  ArrowRight,
} from "lucide-react";
import { Order, Operation } from "../../lib/types/scheduler";

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function EventModal({ isOpen, onClose }: EventModalProps) {
  const { machines, orders, currentTime, injectEvent, executeReschedule } = useProduction();

  const [activeTab, setActiveTab] = useState<
    "FAILURE" | "RECOVERY" | "URGENT_ORDER" | "MAINTENANCE" | "CHANGE_DURATION" | "CHANGE_DEADLINE"
  >("FAILURE");

  // Form states
  const [selectedMachineId, setSelectedMachineId] = useState(machines[0]?.id || "M1");
  const [failureDuration, setFailureDuration] = useState(35);
  const [failureReason, setFailureReason] = useState("Mechanical actuator overload jam");

  const [maintDuration, setMaintDuration] = useState(40);
  const [maintReason, setMaintReason] = useState("Scheduled sensor calibration & lubrication");

  // Urgent Order Form State
  const [urgentCustName, setUrgentCustName] = useState("Lockheed Defense Systems");
  const [urgentProdName, setUrgentProdName] = useState("Missile Guidance Controller");
  const [urgentDeadline, setUrgentDeadline] = useState(currentTime + 60);

  if (!isOpen) return null;

  const handleApplyFailure = (e: React.FormEvent) => {
    e.preventDefault();
    const event = {
      id: `evt-fail-${Date.now()}`,
      type: "MACHINE_FAILURE" as const,
      triggerTime: currentTime,
      applied: true,
      machineId: selectedMachineId,
      duration: Number(failureDuration),
      reason: failureReason,
      description: `Workstation ${selectedMachineId} failed at T=${currentTime}m (${failureDuration}m downtime)`,
    };
    executeReschedule(event);
    onClose();
  };

  const handleApplyRecovery = (e: React.FormEvent) => {
    e.preventDefault();
    const event = {
      id: `evt-recov-${Date.now()}`,
      type: "MACHINE_RECOVERY" as const,
      triggerTime: currentTime,
      applied: true,
      machineId: selectedMachineId,
      description: `Workstation ${selectedMachineId} recovered at T=${currentTime}m`,
    };
    executeReschedule(event);
    onClose();
  };

  const handleApplyMaintenance = (e: React.FormEvent) => {
    e.preventDefault();
    const event = {
      id: `evt-maint-${Date.now()}`,
      type: "START_MAINTENANCE" as const,
      triggerTime: currentTime,
      applied: true,
      machineId: selectedMachineId,
      duration: Number(maintDuration),
      reason: maintReason,
      description: `Workstation ${selectedMachineId} maintenance begins at T=${currentTime}m (${maintDuration}m)`,
    };
    executeReschedule(event);
    onClose();
  };

  const handleApplyUrgentOrder = (e: React.FormEvent) => {
    e.preventDefault();
    const urgentId = `ORD-URG-${Math.floor(100 + Math.random() * 900)}`;
    const urgentOrder: Order = {
      id: urgentId,
      customerName: urgentCustName,
      productName: urgentProdName,
      priority: "CRITICAL",
      quantity: 20,
      deadline: Number(urgentDeadline),
      status: "PENDING",
      createdAtTime: currentTime,
      isUrgent: true,
      operations: [
        {
          id: `OP-${urgentId}-1`,
          orderId: urgentId,
          name: "Component Assembly",
          sequenceNumber: 1,
          requiredCapability: "Component Assembly",
          processingTime: 12,
          dependencies: [],
          status: "PENDING",
        },
        {
          id: `OP-${urgentId}-2`,
          orderId: urgentId,
          name: "Soldering",
          sequenceNumber: 2,
          requiredCapability: "Soldering",
          processingTime: 10,
          dependencies: [`OP-${urgentId}-1`],
          status: "PENDING",
        },
        {
          id: `OP-${urgentId}-3`,
          orderId: urgentId,
          name: "Testing",
          sequenceNumber: 3,
          requiredCapability: "Testing",
          processingTime: 12,
          dependencies: [`OP-${urgentId}-2`],
          status: "PENDING",
        },
        {
          id: `OP-${urgentId}-4`,
          orderId: urgentId,
          name: "Quality Inspection",
          sequenceNumber: 4,
          requiredCapability: "Quality Inspection",
          processingTime: 8,
          dependencies: [`OP-${urgentId}-3`],
          status: "PENDING",
        },
      ],
    };

    const event = {
      id: `evt-urg-${Date.now()}`,
      type: "ADD_URGENT_ORDER" as const,
      triggerTime: currentTime,
      applied: true,
      orderId: urgentId,
      urgentOrder,
      description: `CRITICAL Urgent Order ${urgentId} arrives at T=${currentTime}m (Deadline: T=${urgentDeadline}m)`,
    };

    executeReschedule(event);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl bg-slate-900 border border-slate-700 rounded-2xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-800 bg-slate-950/80">
          <div className="flex items-center gap-2.5">
            <Flame className="h-5 w-5 text-rose-400" />
            <div>
              <h3 className="text-base font-bold text-slate-100">
                Inject Real-time Dynamic Factory Disruption
              </h3>
              <p className="text-xs text-slate-400">
                Simulates real-world industrial anomalies at simulated time T={currentTime}m
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

        {/* Tab Navigation */}
        <div className="flex border-b border-slate-800 bg-slate-950/40 px-6 pt-2 gap-2 overflow-x-auto text-xs font-medium">
          <button
            onClick={() => setActiveTab("FAILURE")}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "FAILURE"
                ? "border-rose-500 text-rose-300 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <AlertTriangle className="h-3.5 w-3.5" />
            Machine Failure
          </button>
          <button
            onClick={() => setActiveTab("URGENT_ORDER")}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "URGENT_ORDER"
                ? "border-amber-500 text-amber-300 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Flame className="h-3.5 w-3.5" />
            Urgent Order
          </button>
          <button
            onClick={() => setActiveTab("MAINTENANCE")}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "MAINTENANCE"
                ? "border-purple-500 text-purple-300 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <Wrench className="h-3.5 w-3.5" />
            Maintenance
          </button>
          <button
            onClick={() => setActiveTab("RECOVERY")}
            className={`pb-2.5 px-3 border-b-2 transition-all flex items-center gap-1.5 whitespace-nowrap ${
              activeTab === "RECOVERY"
                ? "border-emerald-500 text-emerald-300 font-bold"
                : "border-transparent text-slate-400 hover:text-slate-200"
            }`}
          >
            <CheckCircle className="h-3.5 w-3.5" />
            Machine Recovery
          </button>
        </div>

        {/* Tab Body */}
        <div className="p-6">
          {activeTab === "FAILURE" && (
            <form onSubmit={handleApplyFailure} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Machine / Workstation
                  </label>
                  <select
                    value={selectedMachineId}
                    onChange={(e) => setSelectedMachineId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                  >
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} — {m.name} ({m.capabilities.join(", ")})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Downtime Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="5"
                    max="180"
                    value={failureDuration}
                    onChange={(e) => setFailureDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Failure Diagnostic Description
                </label>
                <input
                  type="text"
                  value={failureReason}
                  onChange={(e) => setFailureReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-rose-500 focus:outline-none"
                />
              </div>

              <div className="p-3 rounded-lg bg-rose-950/40 border border-rose-800/60 text-xs text-rose-300">
                <strong>Disruption Impact:</strong> Any ongoing operation on this workstation will be immediately preempted and queued for rescheduling onto compatible backup stations.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold shadow-lg shadow-rose-600/30"
                >
                  Trigger Machine Failure & Reschedule
                </button>
              </div>
            </form>
          )}

          {activeTab === "URGENT_ORDER" && (
            <form onSubmit={handleApplyUrgentOrder} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Customer Name
                  </label>
                  <input
                    type="text"
                    value={urgentCustName}
                    onChange={(e) => setUrgentCustName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Product Name
                  </label>
                  <input
                    type="text"
                    value={urgentProdName}
                    onChange={(e) => setUrgentProdName(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Priority Level
                  </label>
                  <input
                    type="text"
                    disabled
                    value="CRITICAL (Urgent Insertion)"
                    className="w-full px-3 py-2 rounded-lg bg-rose-950/60 border border-rose-800 text-rose-300 text-xs font-bold"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Deadline (Simulation Minute)
                  </label>
                  <input
                    type="number"
                    min={currentTime + 20}
                    value={urgentDeadline}
                    onChange={(e) => setUrgentDeadline(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-amber-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div className="p-3 rounded-lg bg-amber-950/40 border border-amber-800/60 text-xs text-amber-300">
                <strong>Production Routing:</strong> Will inject 4 dependent operations: Component Assembly (12m) → Soldering (10m) → Testing (12m) → Quality Inspection (8m).
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold shadow-lg shadow-amber-500/30"
                >
                  Insert Urgent Order & Reschedule
                </button>
              </div>
            </form>
          )}

          {activeTab === "MAINTENANCE" && (
            <form onSubmit={handleApplyMaintenance} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Target Machine
                  </label>
                  <select
                    value={selectedMachineId}
                    onChange={(e) => setSelectedMachineId(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                  >
                    {machines.map((m) => (
                      <option key={m.id} value={m.id}>
                        {m.id} — {m.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                    Maintenance Duration (Minutes)
                  </label>
                  <input
                    type="number"
                    min="10"
                    max="120"
                    value={maintDuration}
                    onChange={(e) => setMaintDuration(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Maintenance Reason
                </label>
                <input
                  type="text"
                  value={maintReason}
                  onChange={(e) => setMaintReason(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-purple-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-xs font-bold shadow-lg shadow-purple-600/30"
                >
                  Start Maintenance & Reschedule
                </button>
              </div>
            </form>
          )}

          {activeTab === "RECOVERY" && (
            <form onSubmit={handleApplyRecovery} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Machine to Restore to AVAILABLE
                </label>
                <select
                  value={selectedMachineId}
                  onChange={(e) => setSelectedMachineId(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg bg-slate-950 border border-slate-700 text-slate-200 text-xs focus:ring-1 focus:ring-emerald-500 focus:outline-none"
                >
                  {machines.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.id} — {m.name} (Current Status: {m.status})
                    </option>
                  ))}
                </select>
              </div>

              <div className="p-3 rounded-lg bg-emerald-950/40 border border-emerald-800/60 text-xs text-emerald-300">
                <strong>Recovery Action:</strong> Restores machine capacity immediately. Scheduler will re-balance queued operations to utilize this recovered machine.
              </div>

              <div className="flex justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/30"
                >
                  Restore Machine & Reschedule
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

