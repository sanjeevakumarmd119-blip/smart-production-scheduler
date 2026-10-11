import React from "react";
import Link from "next/link";
import { Cpu, Terminal, ShieldCheck, Github, ExternalLink } from "lucide-react";

export function Footer() {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950 text-slate-400 text-xs mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-6 w-6 rounded bg-cyan-950/80 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Cpu className="h-3.5 w-3.5" />
            </div>
            <div>
              <span className="text-slate-200 font-medium">Smart Dynamic Production Scheduling System</span>
              <p className="text-[11px] text-slate-500">
                Electronics Manufacturing Plant Simulation & Optimization Platform
              </p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-4 text-[11px]">
            <Link
              href="/about/algorithm"
              className="flex items-center gap-1 text-cyan-400 hover:text-cyan-300 transition-colors"
            >
              <Terminal className="h-3.5 w-3.5" />
              C++17 Implementation
            </Link>
            <span className="text-slate-700">|</span>
            <Link
              href="/demo"
              className="text-amber-400 hover:text-amber-300 font-medium transition-colors"
            >
              Interactive Viva Demonstration Mode
            </Link>
            <span className="text-slate-700">|</span>
            <span className="flex items-center gap-1 text-slate-400">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Deterministic Heuristic Engine
            </span>
          </div>
        </div>
      </div>
    </footer>
  );
}

