"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Activity,
  Cpu,
  Layers,
  ListOrdered,
  PlaySquare,
  BarChart3,
  BookOpen,
  Sparkles,
  Database,
  Radio,
  Clock,
} from "lucide-react";
import { useProduction } from "../../lib/context/ProductionContext";

export function Navbar() {
  const pathname = usePathname();
  const { activeScenario, simulationStatus, formattedTime, currentTime, isRunning } = useProduction();

  const navLinks = [
    { href: "/dashboard", label: "Dashboard", icon: Activity },
    { href: "/simulator", label: "Simulator & Gantt", icon: PlaySquare },
    { href: "/scenarios", label: "Scenarios", icon: Layers },
    { href: "/orders", label: "Orders (DAG)", icon: ListOrdered },
    { href: "/machines", label: "Machines", icon: Cpu },
    { href: "/results", label: "Analytics", icon: BarChart3 },
    { href: "/demo", label: "Viva Demo Mode", icon: Sparkles, highlight: true },
    { href: "/about/algorithm", label: "C++ & Algorithm", icon: BookOpen },
  ];

  const getStatusColor = () => {
    switch (simulationStatus) {
      case "RUNNING":
        return "bg-emerald-500/20 text-emerald-400 border-emerald-500/40";
      case "PAUSED":
        return "bg-amber-500/20 text-amber-400 border-amber-500/40";
      case "RESCHEDULING_REQUIRED":
        return "bg-rose-500/20 text-rose-400 border-rose-500/40 animate-pulse";
      case "COMPLETED":
        return "bg-cyan-500/20 text-cyan-400 border-cyan-500/40";
      default:
        return "bg-slate-800 text-slate-300 border-slate-700";
    }
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-slate-950/90 backdrop-blur-md">
      <div className="flex h-16 items-center justify-between px-4 sm:px-6 lg:px-8">
        {/* Brand & Plant Info */}
        <div className="flex items-center gap-3">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-cyan-950 border border-cyan-500/40 text-cyan-400 group-hover:border-cyan-400 transition-colors shadow-[0_0_15px_rgba(6,182,212,0.15)]">
              <Cpu className="h-5 w-5 animate-pulse-subtle" />
            </div>
            <div>
              <span className="text-sm font-semibold tracking-wider text-slate-100 uppercase flex items-center gap-1.5">
                OptiSched <span className="text-xs px-1.5 py-0.5 rounded bg-cyan-900/60 text-cyan-300 font-mono">v1.0</span>
              </span>
              <p className="text-[11px] text-slate-400 truncate max-w-[200px] sm:max-w-none">
                Automated Electronics Manufacturing Plant
              </p>
            </div>
          </Link>

          {/* Active Preset Tag */}
          <div className="hidden xl:flex items-center gap-2 pl-4 border-l border-slate-800 text-xs">
            <span className="text-slate-500">Scenario:</span>
            <span className="px-2 py-0.5 rounded bg-slate-900 border border-slate-700 text-slate-300 font-medium truncate max-w-[220px]">
              {activeScenario.name}
            </span>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => {
            const Icon = link.icon;
            const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  isActive
                    ? "bg-slate-800 text-cyan-400 shadow-inner border border-slate-700"
                    : link.highlight
                    ? "text-amber-400 hover:bg-amber-950/40 hover:text-amber-300 border border-amber-500/30"
                    : "text-slate-300 hover:text-slate-100 hover:bg-slate-900/80"
                }`}
              >
                <Icon className={`h-3.5 w-3.5 ${link.highlight && !isActive ? "text-amber-400" : ""}`} />
                {link.label}
              </Link>
            );
          })}
        </nav>

        {/* Telemetry & Factory Status */}
        <div className="flex items-center gap-3">
          {/* Simulated Clock Badge */}
          <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-200 text-xs font-mono">
            <Clock className="h-3.5 w-3.5 text-cyan-400" />
            <span className="font-semibold text-cyan-400">{formattedTime}</span>
            <span className="text-[10px] text-slate-400">(T={currentTime}m)</span>
          </div>

          {/* Real-time Status Badge */}
          <div
            className={`flex items-center gap-1.5 px-2.5 py-1 rounded border text-xs font-mono font-medium tracking-wide uppercase ${getStatusColor()}`}
          >
            <span
              className={`h-2 w-2 rounded-full ${
                isRunning ? "bg-emerald-400 animate-ping" : "bg-slate-400"
              }`}
            />
            {simulationStatus.replace("_", " ")}
          </div>
        </div>
      </div>

      {/* Mobile Nav Bar */}
      <div className="md:hidden flex items-center gap-1 overflow-x-auto px-4 py-2 border-t border-slate-800/60 bg-slate-950/60 scrollbar-none">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || (link.href !== "/" && pathname?.startsWith(link.href));
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1 whitespace-nowrap px-2.5 py-1 rounded text-[11px] font-medium transition-all ${
                isActive
                  ? "bg-cyan-950 text-cyan-400 border border-cyan-500/40"
                  : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
              }`}
            >
              <Icon className="h-3 w-3" />
              {link.label}
            </Link>
          );
        })}
      </div>
    </header>
  );
}

