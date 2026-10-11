"use client";

import React from "react";
import Link from "next/link";
import {
  Cpu,
  Play,
  Sparkles,
  Zap,
  Activity,
  Layers,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  Terminal,
  CheckCircle2,
  BarChart3,
} from "lucide-react";
import { useProduction } from "../lib/context/ProductionContext";

export default function LandingPage() {
  const { loadPresetById } = useProduction();

  return (
    <div className="flex flex-col min-h-full bg-grid-pattern">
      {/* Hero Section */}
      <section className="relative overflow-hidden py-16 sm:py-24 border-b border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 text-center space-y-6">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-950/80 border border-cyan-500/40 text-cyan-300 text-xs font-mono font-medium shadow-lg">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-ping" />
            DSA Academic Project • Electronics Plant Optimization
          </div>

          {/* Title */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-100 tracking-tight max-w-4xl mx-auto uppercase">
            Smart Dynamic <br className="hidden sm:inline" />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-teal-300 to-indigo-400">
              Production Scheduling
            </span>{" "}
            & Machine Optimization
          </h1>

          {/* Subtitle */}
          <p className="text-sm sm:text-base text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Adaptive production planning for changing manufacturing conditions. Designed for Mr. Rohan Malhotra’s automated electronics manufacturing plant with multi-operation dependency DAGs, heuristic load balancing, and real-time dynamic rescheduling.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            <Link
              href="/simulator"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-cyan-500/25 transition-all hover:scale-105"
            >
              <Play className="h-4 w-4" />
              Launch Simulator
            </Link>

            <Link
              href="/demo"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider shadow-lg shadow-amber-500/25 transition-all hover:scale-105"
            >
              <Sparkles className="h-4 w-4" />
              Interactive Viva Demo
            </Link>

            <Link
              href="/about/algorithm"
              className="flex items-center gap-2 px-6 py-3 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold text-xs transition-colors"
            >
              <Terminal className="h-4 w-4 text-cyan-400" />
              View C++17 Reference
            </Link>
          </div>
        </div>
      </section>

      {/* 3 Core Pillars Section */}
      <section className="py-16 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <span className="text-xs font-mono font-bold text-cyan-400 uppercase tracking-wider">
            System Architecture
          </span>
          <h2 className="text-2xl font-bold text-slate-100 mt-1">
            Three Core Capabilities of OptiSched
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pillar 1 */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-3 hover:border-cyan-500/50 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-cyan-950 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
              <Zap className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
              1. OPTIMIZE
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Generates efficient, conflict-free production schedules. Evaluates priority queues, deadline slack times, and machine speed factors to minimize makespan and idle times.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-3 hover:border-indigo-500/50 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-indigo-950 border border-indigo-500/40 flex items-center justify-center text-indigo-400">
              <Activity className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
              2. SIMULATE
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Discrete-time interactive visualizer with dynamic Gantt charts, live machine telemetry, operation progression, and SVG Directed Acyclic Graphs (DAGs).
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-3 hover:border-emerald-500/50 transition-colors">
            <div className="h-12 w-12 rounded-xl bg-emerald-950 border border-emerald-500/40 flex items-center justify-center text-emerald-400">
              <RefreshCw className="h-6 w-6" />
            </div>
            <h3 className="text-base font-bold text-slate-100 uppercase tracking-wide">
              3. ADAPT
            </h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Intelligent dynamic rescheduling engine that isolates machine breakdowns, accommodates urgent customer orders, and routes around maintenance while strictly preserving completed tasks.
            </p>
          </div>
        </div>
      </section>

      {/* Problem Statement Box */}
      <section className="py-12 bg-slate-900/50 border-y border-slate-800/80">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
          <div className="flex items-center gap-2">
            <Cpu className="h-5 w-5 text-cyan-400" />
            <h3 className="text-sm font-bold text-slate-200 uppercase tracking-wider">
              Academic Problem Statement Background
            </h3>
          </div>
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-300 leading-relaxed space-y-3">
            <p>
              <strong>Context:</strong> Mr. Rohan Malhotra, Production Head of an automated electronics manufacturing plant, oversees multi-step fabrication of customized industrial controllers (Component Assembly → Soldering → Testing → Calibration → Quality Inspection).
            </p>
            <p>
              <strong>Challenge:</strong> Unscheduled machine breakdowns, high-priority emergency orders, and scheduled maintenance windows continuously threaten on-time deliveries and factory utilization.
            </p>
            <p>
              <strong>Engineered Solution:</strong> This platform implements a deterministic multi-attribute heuristic scheduling engine with full visual simulation, before/after comparative analysis, Theory of Constraints bottleneck detection, and an exact standalone C++17 reference implementation.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

