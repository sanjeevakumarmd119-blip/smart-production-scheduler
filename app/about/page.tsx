import React from "react";
import Link from "next/link";
import { Cpu, Terminal, ShieldCheck, Sparkles, BookOpen, Layers, CheckCircle2, ArrowRight } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-5xl mx-auto space-y-8">
      {/* Header */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-2">
        <div className="flex items-center gap-2">
          <Cpu className="h-5 w-5 text-cyan-400" />
          <h1 className="text-xl font-bold text-slate-100 uppercase tracking-tight">
            About OptiSched • Smart Production Scheduling System
          </h1>
        </div>
        <p className="text-xs text-slate-400">
          Academic College Final Year Project & Technical Viva Documentation
        </p>
      </div>

      {/* Project Overview Card */}
      <div className="bg-slate-950 border border-slate-800 rounded-2xl p-6 shadow-xl space-y-4 text-xs text-slate-300 leading-relaxed">
        <h2 className="text-sm font-bold text-slate-100 uppercase tracking-wider">
          Executive Summary & Industrial Problem Statement
        </h2>
        <p>
          In automated manufacturing plants, such as Mr. Rohan Malhotra’s electronics facility, robotic workstations process customized industrial controllers through complex multi-operation stages (Component Assembly, Precision Soldering, Automated In-Circuit Testing, Laser Calibration, and Optical AOI Quality Inspection).
        </p>
        <p>
          Real-world production is heavily disrupted by unscheduled machine breakdowns, emergency customer insertions, and maintenance requirements. Delays in critical path operations propagate across dependent products, causing bottlenecks, missed deadlines, and lost revenue.
        </p>
        <p>
          OptiSched solves this problem through an intelligent, deterministic priority-slack heuristic scheduler coupled with a dynamic rescheduling engine that isolates disruptions and adapts in real-time.
        </p>
      </div>

      {/* Key Architectural Highlights */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-cyan-400 font-bold text-xs uppercase">
            <Layers className="h-4 w-4" />
            Full-Stack Technology Stack
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li><strong>Frontend:</strong> Next.js 14 App Router, React 18, TypeScript, Tailwind CSS, Lucide React</li>
            <li><strong>Visualization:</strong> Interactive Gantt Canvas/SVG, Recharts, SVG DAG Graph</li>
            <li><strong>Database:</strong> Neon Serverless PostgreSQL with Drizzle ORM</li>
            <li><strong>Verification:</strong> Vitest automated unit & integration test suites</li>
            <li><strong>Core Algorithms:</strong> C++17 Reference STL Engine + TypeScript Web Engine</li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-slate-950 border border-slate-800 shadow-xl space-y-3">
          <div className="flex items-center gap-2 text-amber-400 font-bold text-xs uppercase">
            <ShieldCheck className="h-4 w-4" />
            Academic Viva Readiness
          </div>
          <ul className="text-xs text-slate-400 space-y-1.5 list-disc list-inside">
            <li>Deterministic results for identical inputs (zero pseudorandom randomness)</li>
            <li>Step-by-step explainable AI decision logs for all workstation assignments</li>
            <li>Before vs After rescheduling diff table with net delta variance indicators</li>
            <li>Built-in 6-step guided Viva Demonstration Mode</li>
            <li>Direct mapping between TypeScript scheduling logic and C++17 STL code</li>
          </ul>
        </div>
      </div>

      {/* Quick Links */}
      <div className="flex flex-wrap gap-3">
        <Link
          href="/about/algorithm"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-500 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow"
        >
          <Terminal className="h-4 w-4" />
          View C++ Algorithm Documentation
        </Link>
        <Link
          href="/demo"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs uppercase tracking-wider transition-colors shadow"
        >
          <Sparkles className="h-4 w-4" />
          Launch Viva Demo Mode
        </Link>
      </div>
    </div>
  );
}

