"use client";

import React, { useState } from "react";
import { Order, Operation, ScheduleEntry } from "../../lib/types/scheduler";
import { Layers, ArrowRight, CheckCircle2, Clock, Play, ShieldAlert, Cpu } from "lucide-react";

interface DAGViewerProps {
  orders: Order[];
  scheduleEntries: ScheduleEntry[];
  currentTime: number;
}

export function DAGViewer({ orders, scheduleEntries, currentTime }: DAGViewerProps) {
  const [selectedOrderId, setSelectedOrderId] = useState<string>(orders[0]?.id || "");

  const activeOrder = orders.find((o) => o.id === selectedOrderId) || orders[0];

  if (!activeOrder) {
    return (
      <div className="p-6 bg-slate-950 border border-slate-800 rounded-xl text-center text-slate-400 text-sm">
        No orders available to render DAG.
      </div>
    );
  }

  const getOpStatus = (op: Operation) => {
    const entry = scheduleEntries.find((e) => e.operationId === op.id);
    if (!entry) return { label: "UNSCHEDULED", color: "bg-slate-900 border-slate-700 text-slate-400" };

    if (currentTime >= entry.endTime) {
      return { label: "COMPLETED", color: "bg-emerald-950 border-emerald-500 text-emerald-300" };
    }
    if (currentTime >= entry.startTime && currentTime < entry.endTime) {
      return { label: "RUNNING", color: "bg-cyan-950 border-cyan-400 text-cyan-300 animate-pulse shadow-[0_0_12px_rgba(6,182,212,0.3)]" };
    }
    // Check if dependencies are complete
    const allDepsDone = op.dependencies.every((depId) => {
      const depEntry = scheduleEntries.find((e) => e.operationId === depId);
      return depEntry && currentTime >= depEntry.endTime;
    });

    if (allDepsDone) {
      return { label: "READY", color: "bg-blue-950 border-blue-500 text-blue-300" };
    }
    return { label: "BLOCKED", color: "bg-amber-950/60 border-amber-600/60 text-amber-300" };
  };

  return (
    <div className="flex flex-col bg-slate-950 border border-slate-800 rounded-xl overflow-hidden shadow-xl">
      {/* Header with Order Selector */}
      <div className="flex flex-wrap items-center justify-between px-4 py-3 bg-slate-900/90 border-b border-slate-800 gap-3">
        <div className="flex items-center gap-2">
          <Layers className="h-4 w-4 text-cyan-400" />
          <h3 className="text-sm font-semibold text-slate-100 uppercase tracking-wider">
            Operation Dependency Graph (DAG)
          </h3>
        </div>

        {/* Order Selector Pills */}
        <div className="flex items-center gap-1.5 overflow-x-auto max-w-full pb-1 sm:pb-0">
          {orders.map((ord) => (
            <button
              key={ord.id}
              onClick={() => setSelectedOrderId(ord.id)}
              className={`px-2.5 py-1 rounded text-xs font-mono font-medium transition-all whitespace-nowrap ${
                ord.id === activeOrder.id
                  ? "bg-cyan-950 border border-cyan-500 text-cyan-300 shadow"
                  : "bg-slate-900 border border-slate-800 text-slate-400 hover:text-slate-200"
              }`}
            >
              {ord.id} ({ord.priority})
            </button>
          ))}
        </div>
      </div>

      {/* Active Order Summary */}
      <div className="px-4 py-2.5 bg-slate-900/40 border-b border-slate-800/80 flex flex-wrap items-center justify-between text-xs text-slate-300 gap-2">
        <div>
          <span className="font-semibold text-slate-100">{activeOrder.productName}</span> • Client:{" "}
          <span className="text-slate-400">{activeOrder.customerName}</span>
        </div>
        <div className="flex items-center gap-3 font-mono text-[11px]">
          <span>Deadline: T={activeOrder.deadline}m</span>
          <span>Qty: {activeOrder.quantity} units</span>
          <span
            className={`px-2 py-0.5 rounded text-[10px] font-bold ${
              activeOrder.priority === "CRITICAL"
                ? "bg-rose-950 text-rose-300 border border-rose-600"
                : activeOrder.priority === "HIGH"
                ? "bg-amber-950 text-amber-300 border border-amber-600"
                : "bg-slate-800 text-slate-300"
            }`}
          >
            {activeOrder.priority}
          </span>
        </div>
      </div>

      {/* Interactive DAG Nodes Chain */}
      <div className="p-6 overflow-x-auto bg-grid-pattern">
        <div className="flex items-center justify-start gap-4 min-w-max py-4">
          {activeOrder.operations.map((op, idx) => {
            const statusInfo = getOpStatus(op);
            const entry = scheduleEntries.find((e) => e.operationId === op.id);

            return (
              <React.Fragment key={op.id}>
                {/* Operation Node Card */}
                <div
                  className={`w-64 p-3.5 rounded-xl border transition-all flex flex-col justify-between shadow-lg ${statusInfo.color}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-1.5 py-0.5 rounded bg-slate-900/80 border border-slate-700">
                      Step {op.sequenceNumber}
                    </span>
                    <span className="text-[10px] font-mono font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-slate-950/90 border border-current">
                      {statusInfo.label}
                    </span>
                  </div>

                  <h4 className="font-semibold text-sm text-slate-100 mb-1">{op.name}</h4>

                  <div className="space-y-1 text-[11px] text-slate-300 font-mono mt-2">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Required:</span>
                      <span className="text-cyan-300">{op.requiredCapability}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Base Time:</span>
                      <span>{op.processingTime} min</span>
                    </div>
                    {entry && (
                      <>
                        <div className="flex justify-between border-t border-slate-700/50 pt-1 mt-1">
                          <span className="text-slate-400">Workstation:</span>
                          <span className="font-semibold text-slate-200">{entry.machineId}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-slate-400">Window:</span>
                          <span>
                            T={entry.startTime}m → {entry.endTime}m
                          </span>
                        </div>
                      </>
                    )}
                    {op.dependencies.length > 0 && (
                      <div className="text-[10px] text-slate-400 pt-1">
                        Depends on: <span className="text-amber-300">{op.dependencies.join(", ")}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Arrow to Next Node */}
                {idx < activeOrder.operations.length - 1 && (
                  <div className="flex flex-col items-center text-slate-500">
                    <ArrowRight className="h-6 w-6 text-cyan-500/70" />
                    <span className="text-[9px] font-mono text-slate-500">precedes</span>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </div>
      </div>
    </div>
  );
}

