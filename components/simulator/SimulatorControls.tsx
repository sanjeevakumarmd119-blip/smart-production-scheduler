"use client";

import React, { useState } from "react";
import { useProduction } from "../../lib/context/ProductionContext";
import {
  Play,
  Pause,
  RotateCcw,
  StepForward,
  FastForward,
  Sparkles,
  AlertOctagon,
  PlusCircle,
  RefreshCw,
  Clock,
  Zap,
} from "lucide-react";
import { EventModal } from "./EventModal";
import { RescheduleDiffModal } from "./RescheduleDiffModal";

export function SimulatorControls() {
  const {
    currentTime,
    formattedTime,
    isRunning,
    playbackSpeed,
    simulationStatus,
    statusMessage,
    startSimulation,
    pauseSimulation,
    resumeSimulation,
    stepSimulation,
    resetSimulation,
    setSpeed,
    generateSchedule,
    lastRescheduleComparison,
  } = useProduction();

  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isDiffModalOpen, setIsDiffModalOpen] = useState(false);

  const speedOptions = [0.5, 1, 2, 5, 10];

  return (
    <div className="flex flex-col gap-3 bg-slate-950 border border-slate-800 rounded-xl p-4 shadow-xl">
      {/* Top Bar: Playback Controls & Speed */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Playback Button Group */}
        <div className="flex items-center gap-2">
          {isRunning ? (
            <button
              onClick={pauseSimulation}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-amber-500/20"
            >
              <Pause className="h-4 w-4" />
              Pause
            </button>
          ) : (
            <button
              onClick={startSimulation}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
            >
              <Play className="h-4 w-4" />
              {currentTime > 0 ? "Resume" : "Start Simulation"}
            </button>
          )}

          {/* Step Controls */}
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            <button
              onClick={() => stepSimulation(1)}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-800 text-slate-300 disabled:opacity-40 rounded text-xs transition-colors"
              title="Step forward 1 minute"
            >
              <StepForward className="h-3.5 w-3.5" />
              +1m
            </button>
            <button
              onClick={() => stepSimulation(5)}
              disabled={isRunning}
              className="flex items-center gap-1 px-2.5 py-1.5 hover:bg-slate-800 text-slate-300 disabled:opacity-40 rounded text-xs transition-colors"
              title="Step forward 5 minutes"
            >
              <FastForward className="h-3.5 w-3.5" />
              +5m
            </button>
          </div>

          {/* Reset Button */}
          <button
            onClick={resetSimulation}
            className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-300 text-xs font-medium transition-colors"
            title="Reset simulation to T=0"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            Reset
          </button>
        </div>

        {/* Speed Selector */}
        <div className="flex items-center gap-2">
          <span className="text-xs text-slate-400 font-mono flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-cyan-400" />
            Speed:
          </span>
          <div className="flex items-center bg-slate-900 border border-slate-800 rounded-lg p-0.5">
            {speedOptions.map((spd) => (
              <button
                key={spd}
                onClick={() => setSpeed(spd)}
                className={`px-2.5 py-1 rounded text-xs font-mono font-semibold transition-all ${
                  playbackSpeed === spd
                    ? "bg-cyan-500 text-slate-950 shadow"
                    : "text-slate-400 hover:text-slate-200"
                }`}
              >
                {spd}x
              </button>
            ))}
          </div>
        </div>

        {/* Action Buttons: Inject Event & Compare Reschedule */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsEventModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-rose-950/80 hover:bg-rose-900 border border-rose-500/50 text-rose-300 text-xs font-semibold transition-colors shadow"
          >
            <AlertOctagon className="h-3.5 w-3.5" />
            + Inject Event
          </button>

          {lastRescheduleComparison && (
            <button
              onClick={() => setIsDiffModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-indigo-950/80 hover:bg-indigo-900 border border-indigo-500/50 text-indigo-300 text-xs font-semibold transition-colors shadow"
            >
              <RefreshCw className="h-3.5 w-3.5 animate-spin-slow" />
              Before vs After
            </button>
          )}

          <button
            onClick={generateSchedule}
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 text-xs font-medium transition-colors"
          >
            <Sparkles className="h-3.5 w-3.5 text-cyan-400" />
            Recompute
          </button>
        </div>
      </div>

      {/* Live Status Message Bar */}
      <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-900/90 border border-slate-800 text-xs">
        <div className="flex items-center gap-2 truncate">
          <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
          <span className="text-slate-400 font-mono">Status:</span>
          <span className="text-slate-200 font-medium truncate">{statusMessage}</span>
        </div>
        <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400 flex-shrink-0 pl-2">
          <span>Clock: <strong className="text-cyan-400">{formattedTime}</strong></span>
          <span>(Minute {currentTime})</span>
        </div>
      </div>

      {/* Modal Dialogs */}
      {isEventModalOpen && (
        <EventModal
          isOpen={isEventModalOpen}
          onClose={() => setIsEventModalOpen(false)}
        />
      )}

      {isDiffModalOpen && lastRescheduleComparison && (
        <RescheduleDiffModal
          isOpen={isDiffModalOpen}
          onClose={() => setIsDiffModalOpen(false)}
          comparison={lastRescheduleComparison}
        />
      )}
    </div>
  );
}

