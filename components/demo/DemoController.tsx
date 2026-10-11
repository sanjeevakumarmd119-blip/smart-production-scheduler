"use client";

import React, { useState } from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import { PRESET_SCENARIOS } from "../../lib/presets/presets";
import {
  Sparkles,
  Play,
  ArrowRight,
  AlertTriangle,
  Flame,
  Wrench,
  CheckCircle2,
  RotateCcw,
  RefreshCw,
  Eye,
} from "lucide-react";

export function DemoController() {
  const {
    loadPresetById,
    currentTime,
    stepSimulation,
    startSimulation,
    pauseSimulation,
    resetSimulation,
    executeReschedule,
    lastRescheduleComparison,
  } = useProduction();

  const [currentStep, setCurrentStep] = useState<number>(1);
  const [showDiff, setShowDiff] = useState<boolean>(false);

  const steps = [
    {
      step: 1,
      title: "1. Factory Baseline Initialization",
      description: "Loads a realistic electronics manufacturing plant with 6 workstations and 3 multi-stage production orders. Initial schedule is generated with 0 conflicts.",
      actionText: "Initialize Baseline Scenario",
      onAction: () => {
        loadPresetById("preset-8-dynamic-stress");
        setCurrentStep(2);
      },
    },
    {
      step: 2,
      title: "2. Fast Forward to T=30m & Trigger Machine Breakdown",
      description: "Advances simulated clock to T=30m. Testing Station Alpha (M3) encounters an unexpected hardware fault (35 min downtime).",
      actionText: "Advance to T=30m & Trigger M3 Failure",
      onAction: () => {
        stepSimulation(30);
        executeReschedule({
          type: "MACHINE_FAILURE",
          machineId: "M3",
          description: "Testing Station Alpha (M3) hardware fault at T=30m (35m downtime)",
        });
        setCurrentStep(3);
      },
    },
    {
      step: 3,
      title: "3. Insert High-Priority Urgent Customer Order at T=40m",
      description: "At T=40m, an emergency military defense order (ORD-URG-88) arrives requiring instant priority queue preemption without starving standard batches.",
      actionText: "Advance to T=40m & Insert Urgent Order",
      onAction: () => {
        stepSimulation(10);
        const urgentOrder = {
          id: "ORD-URG-88",
          customerName: "AeroVironment UAV",
          productName: "Drone Flight Navigation Controller",
          priority: "CRITICAL" as const,
          quantity: 20,
          deadline: 95,
          status: "PENDING" as const,
          createdAtTime: 40,
          isUrgent: true,
          operations: [
            { id: "OP-88-1", orderId: "ORD-URG-88", name: "Component Assembly", sequenceNumber: 1, requiredCapability: "Component Assembly", processingTime: 12, dependencies: [], status: "PENDING" as const },
            { id: "OP-88-2", orderId: "ORD-URG-88", name: "Soldering", sequenceNumber: 2, requiredCapability: "Soldering", processingTime: 10, dependencies: ["OP-88-1"], status: "PENDING" as const },
            { id: "OP-88-3", orderId: "ORD-URG-88", name: "Testing", sequenceNumber: 3, requiredCapability: "Testing", processingTime: 10, dependencies: ["OP-88-2"], status: "PENDING" as const },
            { id: "OP-88-4", orderId: "ORD-URG-88", name: "Quality Inspection", sequenceNumber: 4, requiredCapability: "Quality Inspection", processingTime: 6, dependencies: ["OP-88-3"], status: "PENDING" as const },
          ],
        };
        executeReschedule({
          type: "ADD_URGENT_ORDER",
          orderId: "ORD-URG-88",
          description: "CRITICAL Urgent Order ORD-URG-88 arrived at T=40m",
        });
        setCurrentStep(4);
      },
    },
    {
      step: 4,
      title: "4. Trigger Scheduled Maintenance on Workstation M4 at T=60m",
      description: "Calibration Station (M4) goes offline for optical laser tuning from T=60m to T=90m. The dynamic rescheduler routes remaining jobs to secondary multi-tool cell M6.",
      actionText: "Advance to T=60m & Start M4 Maintenance",
      onAction: () => {
        stepSimulation(20);
        executeReschedule({
          type: "START_MAINTENANCE",
          machineId: "M4",
          description: "Calibration Station M4 scheduled laser tuning at T=60m (30m)",
        });
        setCurrentStep(5);
      },
    },
    {
      step: 5,
      title: "5. Complete Production & Evaluate Viva Analytics",
      description: "Runs simulator until all manufacturing orders are successfully fulfilled. Observe the before vs after delta comparison and overall schedule optimization score.",
      actionText: "Finish Simulation & View Results",
      onAction: () => {
        stepSimulation(80);
        setCurrentStep(6);
      },
    },
    {
      step: 6,
      title: "6. Viva Demonstration Completed!",
      description: "Demonstration successful! The system proved dynamic resilience by isolating disruptions, avoiding dependency conflicts, and completing critical orders on time.",
      actionText: "Restart Guided Demo",
      onAction: () => {
        resetSimulation();
        setCurrentStep(1);
      },
    },
  ];

  const activeStepObj = steps.find((s) => s.step === currentStep) || steps[0];

  return (
    <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center shadow-[0_0_15px_rgba(245,158,11,0.2)]">
            <Sparkles className="h-5 w-5 animate-pulse" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              College Viva & Demonstration Assistant
              <span className="text-xs px-2 py-0.5 rounded bg-amber-950 border border-amber-500/40 text-amber-300 font-mono">
                Step {currentStep} of 6
              </span>
            </h2>
            <p className="text-xs text-slate-400">
              Deterministic, structured evaluation walkthrough for academic faculty and viva examiners
            </p>
          </div>
        </div>

        <button
          onClick={() => {
            resetSimulation();
            setCurrentStep(1);
          }}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-semibold"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          Reset Demo
        </button>
      </div>

      {/* Step Progress Tracker */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 text-xs font-mono">
        {steps.map((s) => (
          <div
            key={s.step}
            onClick={() => setCurrentStep(s.step)}
            className={`p-2.5 rounded-lg border cursor-pointer transition-all ${
              s.step === currentStep
                ? "bg-amber-950/60 border-amber-500 text-amber-300 font-bold shadow"
                : s.step < currentStep
                ? "bg-slate-900 border-slate-700 text-emerald-400"
                : "bg-slate-950 border-slate-800/80 text-slate-500"
            }`}
          >
            <div className="flex items-center justify-between text-[10px]">
              <span>Step {s.step}</span>
              {s.step < currentStep && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
            </div>
            <span className="text-[11px] truncate block mt-1">
              {s.step === 1 ? "Baseline" : s.step === 2 ? "M3 Failure" : s.step === 3 ? "Urgent Order" : s.step === 4 ? "M4 Maint" : s.step === 5 ? "Simulate" : "Verdict"}
            </span>
          </div>
        ))}
      </div>

      {/* Active Step Hero Card */}
      <div className="p-6 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 shadow-inner">
        <div className="space-y-2 max-w-2xl">
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            Active Demonstration Phase
          </span>
          <h3 className="text-base sm:text-lg font-bold text-slate-100">{activeStepObj.title}</h3>
          <p className="text-xs text-slate-300 leading-relaxed">{activeStepObj.description}</p>
        </div>

        <button
          onClick={activeStepObj.onAction}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/30 transition-all hover:scale-[1.02] flex-shrink-0"
        >
          <span>{activeStepObj.actionText}</span>
          <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}

