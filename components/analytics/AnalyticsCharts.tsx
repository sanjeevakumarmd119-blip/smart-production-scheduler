"use client";

import React from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Cell,
  Legend,
  PieChart,
  Pie,
} from "recharts";
import { BarChart3, PieChart as PieIcon, Activity, TrendingUp, Info } from "lucide-react";

export function AnalyticsCharts() {
  const { machines, metrics, orders, scheduleEntries } = useProduction();

  // Machine utilization data
  const utilizationData = machines.map((m) => {
    const util = metrics.machineUtilizationById[m.id] || 0;
    const idle = metrics.machineIdleTimeById[m.id] || 0;
    const busy = metrics.totalProductionTime > 0 ? metrics.totalProductionTime - idle : 0;
    return {
      id: m.id,
      name: m.name.length > 14 ? `${m.name.slice(0, 14)}...` : m.name,
      utilization: util,
      busyMinutes: Math.max(0, busy),
      idleMinutes: idle,
      speed: m.processingSpeed,
    };
  });

  // Order timeline & lead time data
  const orderLeadData = orders.map((ord) => {
    const entries = scheduleEntries.filter((e) => e.orderId === ord.id);
    let finish = 0;
    for (const e of entries) {
      if (e.endTime > finish) finish = e.endTime;
    }
    const leadTime = finish - (ord.createdAtTime || 0);
    const delay = Math.max(0, finish - ord.deadline);

    return {
      orderId: ord.id,
      customer: ord.customerName.length > 10 ? `${ord.customerName.slice(0, 10)}..` : ord.customerName,
      leadTime,
      deadline: ord.deadline,
      delay,
      priority: ord.priority,
      status: finish <= ord.deadline ? "On-Time" : "Delayed",
    };
  });

  // Priority distribution data for pie chart
  const priorityMap: Record<string, number> = {};
  for (const ord of orders) {
    priorityMap[ord.priority] = (priorityMap[ord.priority] || 0) + 1;
  }
  const priorityData = Object.entries(priorityMap).map(([prio, count]) => ({
    name: prio,
    value: count,
  }));

  const PRIO_COLORS: Record<string, string> = {
    CRITICAL: "#f43f5e",
    HIGH: "#f59e0b",
    MEDIUM: "#3b82f6",
    LOW: "#10b981",
  };

  const highestUtilMachine = [...utilizationData].sort((a, b) => b.utilization - a.utilization)[0];
  const lowestUtilMachine = [...utilizationData].sort((a, b) => a.utilization - b.utilization)[0];

  return (
    <div className="space-y-6">
      {/* Top 2 Analytics Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1: Machine Utilization Rate */}
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4 text-cyan-400" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Workstation Utilization Rate (%)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-emerald-400 font-bold">
                Avg: {metrics.averageMachineUtilization}%
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="id" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} domain={[0, 100]} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                    formatter={(val: any) => [`${val}%`, "Utilization"]}
                  />
                  <Bar dataKey="utilization" radius={[4, 4, 0, 0]}>
                    {utilizationData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={entry.utilization >= 80 ? "#06b6d4" : entry.utilization >= 50 ? "#3b82f6" : "#64748b"}
                      />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2 mt-2">
            <Info className="h-4 w-4 text-cyan-400 flex-shrink-0 mt-0.5" />
            <p>
              {highestUtilMachine
                ? `Workstation ${highestUtilMachine.id} has the highest utilization at ${highestUtilMachine.utilization}%, while ${lowestUtilMachine?.id} registers ${lowestUtilMachine?.utilization}% utilization.`
                : "No workstation data available."}
            </p>
          </div>
        </div>

        {/* Chart 2: Machine Busy vs Idle Time Breakdown */}
        <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl shadow-xl flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
              <div className="flex items-center gap-2">
                <Activity className="h-4 w-4 text-indigo-400" />
                <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
                  Active Workload vs Idle Time (Minutes)
                </h3>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                Total Idle: {metrics.totalIdleTime} min
              </span>
            </div>

            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={utilizationData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="id" stroke="#64748b" fontSize={11} tickLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
                  />
                  <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
                  <Bar dataKey="busyMinutes" name="Active Busy (min)" fill="#06b6d4" stackId="a" />
                  <Bar dataKey="idleMinutes" name="Idle Waiting (min)" fill="#334155" stackId="a" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2 mt-2">
            <Info className="h-4 w-4 text-indigo-400 flex-shrink-0 mt-0.5" />
            <p>
              Workload stacking highlights idle gaps across workstations to evaluate load-balancing efficiency.
            </p>
          </div>
        </div>
      </div>

      {/* Chart 3: Order Turnaround & Lead Time Distribution */}
      <div className="p-5 bg-slate-950 border border-slate-800 rounded-xl shadow-xl">
        <div className="flex items-center justify-between mb-4 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-emerald-400" />
            <h3 className="text-xs font-semibold text-slate-200 uppercase tracking-wider">
              Order Delivery Lead Time vs Target Deadline (Minutes)
            </h3>
          </div>
          <span className="text-[11px] font-mono text-cyan-400">
            Avg Lead: {metrics.averageOrderCompletionTime} min
          </span>
        </div>

        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={orderLeadData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="orderId" stroke="#64748b" fontSize={11} tickLine={false} />
              <YAxis stroke="#64748b" fontSize={11} tickLine={false} />
              <Tooltip
                contentStyle={{ backgroundColor: "#0f172a", borderColor: "#334155", borderRadius: "8px", fontSize: "12px" }}
              />
              <Legend wrapperStyle={{ fontSize: "11px", paddingTop: "10px" }} />
              <Bar dataKey="leadTime" name="Actual Completion (min)" fill="#10b981" radius={[4, 4, 0, 0]} />
              <Bar dataKey="deadline" name="Customer Deadline (min)" fill="#f59e0b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        <div className="p-3 bg-slate-900/60 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 flex items-start gap-2 mt-4">
          <Info className="h-4 w-4 text-emerald-400 flex-shrink-0 mt-0.5" />
          <p>
            {metrics.delayedOrders > 0
              ? `${metrics.delayedOrders} out of ${metrics.totalOrders} orders exceeded their deadline due to machine constraints and cascading dependencies.`
              : `100% on-time delivery achieved! All ${metrics.totalOrders} production orders completed strictly before customer deadlines.`}
          </p>
        </div>
      </div>
    </div>
  );
}

