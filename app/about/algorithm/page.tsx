"use client";

import React, { useState } from "react";
import {
  Terminal,
  Copy,
  Check,
  Download,
  BookOpen,
  Cpu,
  Layers,
  Zap,
  Activity,
  ShieldCheck,
  Clock,
  ArrowRight,
} from "lucide-react";

export default function AlgorithmPage() {
  const [copied, setCopied] = useState(false);

  const cppCode = `/**
 * ============================================================================
 * PROJECT: Smart Dynamic Production Scheduling and Machine Optimization System
 * ACADEMIC C++17 REFERENCE IMPLEMENTATION
 * 
 * Problem Statement:
 * Automated electronics plant under Production Head Mr. Rohan Malhotra.
 * Workstations: Assembly, Soldering, Testing, Calibration, Quality Inspection.
 * Dynamic disruptions: Machine breakdowns, urgent customer orders, maintenance.
 * 
 * Compile with: g++ -std=c++17 -O3 scheduler.cpp -o scheduler
 * ============================================================================
 */

#include <iostream>
#include <vector>
#include <string>
#include <unordered_map>
#include <unordered_set>
#include <queue>
#include <algorithm>
#include <iomanip>
#include <cmath>

enum class PriorityLevel {
    LOW = 50,
    MEDIUM = 150,
    HIGH = 300,
    CRITICAL = 500
};

enum class MachineStatus {
    AVAILABLE,
    BUSY,
    MAINTENANCE,
    FAILED,
    OFFLINE
};

struct TimeInterval {
    int start;
    int end;
    std::string type; // OCCUPIED, MAINTENANCE, FAILURE
    std::string reason;
};

struct Operation {
    std::string id;
    std::string orderId;
    std::string name;
    int sequenceNumber;
    std::string requiredCapability;
    int processingTime; // base minutes
    std::vector<std::string> dependencies;
    std::string status = "PENDING";
};

struct Order {
    std::string id;
    std::string customerName;
    std::string productName;
    PriorityLevel priority;
    int quantity;
    int deadline; // minute deadline
    int createdAtTime = 0;
    bool isUrgent = false;
    std::vector<Operation> operations;
};

struct Machine {
    std::string id;
    std::string name;
    std::string type;
    std::vector<std::string> capabilities;
    double processingSpeed = 1.0; // speed multiplier
    MachineStatus status = MachineStatus::AVAILABLE;
    std::vector<TimeInterval> blockedIntervals;
};

struct ScheduleEntry {
    std::string id;
    std::string orderId;
    std::string operationId;
    std::string operationName;
    std::string machineId;
    std::string machineName;
    int startTime;
    int endTime;
    int duration;
    std::string explanation;
};

struct EligibleOpNode {
    Operation op;
    Order order;
    int earliestReadyTime;
    int criticalPathLength;
    double priorityScore;

    // Max-Heap Comparator for Priority Queue
    bool operator<(const EligibleOpNode& other) const {
        if (std::abs(priorityScore - other.priorityScore) > 1e-4) {
            return priorityScore < other.priorityScore;
        }
        if (earliestReadyTime != other.earliestReadyTime) {
            return earliestReadyTime > other.earliestReadyTime;
        }
        return criticalPathLength < other.criticalPathLength;
    }
};

double evaluatePriorityScore(const Order& order, const Operation& op, int currentTime) {
    double base = static_cast<double>(order.priority);
    int remainingWork = op.processingTime;
    int estimatedFinish = currentTime + remainingWork;
    int slack = order.deadline - estimatedFinish;

    double slackAdjustment = 0.0;
    if (slack < 0) {
        slackAdjustment = std::abs(slack) * 4.0;
    } else if (slack <= 30) {
        slackAdjustment = (30 - slack) * 2.5;
    } else {
        slackAdjustment = -std::min(slack * 0.2, 50.0);
    }

    double urgentBoost = order.isUrgent ? 250.0 : 0.0;
    return base + slackAdjustment + urgentBoost;
}

int findEarliestFreeSlot(std::vector<TimeInterval>& occupied, int duration, int earliestReady) {
    if (occupied.empty()) return earliestReady;

    std::sort(occupied.begin(), occupied.end(), [](const TimeInterval& a, const TimeInterval& b) {
        return a.start < b.start;
    });

    std::vector<TimeInterval> merged;
    for (const auto& inv : occupied) {
        if (merged.empty()) {
            merged.push_back(inv);
        } else {
            if (inv.start <= merged.back().end) {
                merged.back().end = std::max(merged.back().end, inv.end);
            } else {
                merged.push_back(inv);
            }
        }
    }

    int candidate = earliestReady;
    for (const auto& block : merged) {
        if (candidate + duration <= block.start) {
            return candidate;
        }
        if (candidate < block.end) {
            candidate = block.end;
        }
    }
    return candidate;
}

std::vector<ScheduleEntry> scheduleFactory(
    const std::vector<Order>& orders,
    std::vector<Machine>& machines,
    int currentTime = 0,
    const std::vector<ScheduleEntry>& lockedEntries = {}
) {
    std::vector<ScheduleEntry> schedule = lockedEntries;
    std::unordered_map<std::string, std::vector<TimeInterval>> machineIntervals;
    std::unordered_set<std::string> completedOps;
    std::unordered_map<std::string, int> opEndTimes;

    for (const auto& m : machines) {
        machineIntervals[m.id] = m.blockedIntervals;
    }

    for (const auto& entry : lockedEntries) {
        machineIntervals[entry.machineId].push_back({entry.startTime, entry.endTime, "OCCUPIED", ""});
        completedOps.insert(entry.operationId);
        opEndTimes[entry.operationId] = entry.endTime;
    }

    std::unordered_set<std::string> scheduledOps = completedOps;
    std::unordered_map<std::string, Operation> allOps;
    std::unordered_map<std::string, Order> opOrderMap;

    for (const auto& ord : orders) {
        for (const auto& op : ord.operations) {
            allOps[op.id] = op;
            opOrderMap[op.id] = ord;
        }
    }

    int stepCount = 1;

    while (true) {
        std::vector<EligibleOpNode> eligible;

        for (const auto& [opId, op] : allOps) {
            if (scheduledOps.count(opId)) continue;

            bool depsSatisfied = true;
            int readyTime = std::max(currentTime, opOrderMap[opId].createdAtTime);

            for (const auto& depId : op.dependencies) {
                if (!completedOps.count(depId)) {
                    depsSatisfied = false;
                    break;
                }
                readyTime = std::max(readyTime, opEndTimes[depId]);
            }

            if (depsSatisfied) {
                const auto& ord = opOrderMap[opId];
                double score = evaluatePriorityScore(ord, op, readyTime);
                eligible.push_back({op, ord, readyTime, op.processingTime, score});
            }
        }

        if (eligible.empty()) break;

        std::priority_queue<EligibleOpNode> pq(eligible.begin(), eligible.end());
        EligibleOpNode topNode = pq.top();

        Machine* bestMachine = nullptr;
        int bestStartTime = 1e9;
        int bestDuration = 0;

        for (auto& m : machines) {
            if (m.status == MachineStatus::OFFLINE) continue;

            bool hasCap = false;
            for (const auto& cap : m.capabilities) {
                if (cap == topNode.op.requiredCapability) {
                    hasCap = true;
                    break;
                }
            }
            if (!hasCap) continue;

            int effectiveDuration = std::max(1, static_cast<int>(std::ceil(topNode.op.processingTime / m.processingSpeed)));
            int earliestStart = findEarliestFreeSlot(machineIntervals[m.id], effectiveDuration, topNode.earliestReadyTime);

            if (earliestStart + effectiveDuration < bestStartTime + bestDuration) {
                bestStartTime = earliestStart;
                bestDuration = effectiveDuration;
                bestMachine = &m;
            }
        }

        if (!bestMachine) {
            scheduledOps.insert(topNode.op.id);
            continue;
        }

        int endTime = bestStartTime + bestDuration;
        ScheduleEntry entry{
            "SCHED-" + std::to_string(stepCount++),
            topNode.order.id,
            topNode.op.id,
            topNode.op.name,
            bestMachine->id,
            bestMachine->name,
            bestStartTime,
            endTime,
            bestDuration,
            "Assigned to " + bestMachine->name + " via EFT Heuristic"
        };

        schedule.push_back(entry);
        scheduledOps.insert(topNode.op.id);
        completedOps.insert(topNode.op.id);
        opEndTimes[topNode.op.id] = endTime;
        machineIntervals[bestMachine->id].push_back({bestStartTime, endTime, "OCCUPIED", ""});
    }

    return schedule;
}

int main() {
    std::cout << "OptiSched C++17 Reference Engine Running...\\n";
    // Factory execution demonstration
    return 0;
}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(cppCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const dataStr = "data:text/plain;charset=utf-8," + encodeURIComponent(cppCode);
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "scheduler.cpp");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <BookOpen className="h-5 w-5 text-cyan-400" />
          <h1 className="text-xl font-bold text-slate-100 uppercase tracking-tight">
            Academic Data Structures & Scheduling Algorithm Reference
          </h1>
        </div>
        <p className="text-xs text-slate-400 leading-relaxed max-w-3xl">
          Detailed mathematical formulation, algorithmic workflow, and standalone C++17 implementation for Mr. Rohan Malhotra’s electronics manufacturing optimization problem.
        </p>
      </div>

      {/* 1. Data Structures Table */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Layers className="h-4 w-4" />
          1. Data Structures & Time Complexity Analysis
        </h2>

        <div className="overflow-x-auto rounded-xl border border-slate-800">
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-800 bg-slate-900 text-slate-400 font-mono">
                <th className="py-3 px-4">Data Structure</th>
                <th className="py-3 px-4">C++ STL Container</th>
                <th className="py-3 px-4">Primary Purpose</th>
                <th className="py-3 px-4">Complexity</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono text-slate-300">
              <tr className="hover:bg-slate-900/30">
                <td className="py-3 px-4 font-sans font-semibold text-slate-100">Operation Ready Queue</td>
                <td className="py-3 px-4 text-cyan-300">std::priority_queue</td>
                <td className="py-3 px-4 font-sans text-slate-400">Pops top priority operation based on slack & urgency</td>
                <td className="py-3 px-4 text-emerald-400">O(log N) insert/pop</td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="py-3 px-4 font-sans font-semibold text-slate-100">Dependency DAG</td>
                <td className="py-3 px-4 text-cyan-300">std::unordered_map&lt;string, vector&gt;</td>
                <td className="py-3 px-4 font-sans text-slate-400">Graph adjacency list for predecessor resolution</td>
                <td className="py-3 px-4 text-emerald-400">O(1) avg lookup</td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="py-3 px-4 font-sans font-semibold text-slate-100">Machine Time Intervals</td>
                <td className="py-3 px-4 text-cyan-300">std::vector&lt;TimeInterval&gt;</td>
                <td className="py-3 px-4 font-sans text-slate-400">Stores occupied blocks, maintenance, and failures</td>
                <td className="py-3 px-4 text-emerald-400">O(M log M) interval merge</td>
              </tr>
              <tr className="hover:bg-slate-900/30">
                <td className="py-3 px-4 font-sans font-semibold text-slate-100">Completed Operations</td>
                <td className="py-3 px-4 text-cyan-300">std::unordered_set&lt;string&gt;</td>
                <td className="py-3 px-4 font-sans text-slate-400">Fast O(1) in-degree dependency fulfillment check</td>
                <td className="py-3 px-4 text-emerald-400">O(1) hash check</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* 2. Objective Function Formulation */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <h2 className="text-sm font-bold text-cyan-400 uppercase tracking-wider flex items-center gap-2">
          <Zap className="h-4 w-4" />
          2. Weighted Multi-Objective Function Formulation
        </h2>

        <div className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 font-mono text-xs text-slate-200 leading-relaxed space-y-2">
          <p className="text-cyan-300 font-bold text-sm">
            Schedule Score = (Completion + OnTime + Priority + Utilization) - (Idle + Delay + Conflicts + Missed)
          </p>
          <div className="text-[11px] text-slate-400 pt-2 border-t border-slate-800 space-y-1">
            <div>• <strong className="text-slate-200">Completion Reward:</strong> w_comp × N_completed (Default: +100 per completed batch)</div>
            <div>• <strong className="text-slate-200">On-Time Reward:</strong> w_ontime × N_ontime (Default: +80 per deadline met)</div>
            <div>• <strong className="text-slate-200">Priority Weight:</strong> w_prio × Σ PriorityMultiplier (Critical=4x, High=2.5x, Medium=1.5x, Low=1x)</div>
            <div>• <strong className="text-slate-200">Utilization Factor:</strong> w_util × AvgUtilization (Rewards high machine busy efficiency)</div>
            <div>• <strong className="text-slate-200">Idle Penalty:</strong> w_idle × Σ TotalIdleTime (-1.5 per idle minute)</div>
            <div>• <strong className="text-slate-200">Delay Penalty:</strong> w_delay × Σ TotalDelayTime (-3.0 per late minute)</div>
          </div>
        </div>
      </div>

      {/* 3. C++17 Reference Source Code */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex items-center gap-2">
            <Terminal className="h-4 w-4 text-emerald-400" />
            <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
              Standalone C++17 Reference Implementation (scheduler.cpp)
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-semibold transition-colors"
            >
              {copied ? <Check className="h-3.5 w-3.5 text-emerald-400" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied!" : "Copy Code"}
            </button>
            <button
              onClick={handleDownload}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-slate-950 text-xs font-bold transition-colors shadow"
            >
              <Download className="h-3.5 w-3.5" />
              Download .cpp
            </button>
          </div>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 font-mono overflow-x-auto max-h-[500px] leading-relaxed select-all">
            {cppCode}
          </pre>
        </div>
      </div>
    </div>
  );
}

