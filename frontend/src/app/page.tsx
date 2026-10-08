'use client';

import React, { useState, useMemo } from 'react';
import hotspotsJson from '../data/hotspots.json';
import { Hotspot, Intervention, runSimulationClient } from '../engine/simulator';
import { optimizeAllocationDualMode, AllocationResult } from '../engine/optimizer';
import { TacticalMap } from '../components/TacticalMap';
import { UnderpassGauge } from '../components/UnderpassGauge';
import { RainfallScrubber } from '../components/RainfallScrubber';
import { AllocationConsole } from '../components/AllocationConsole';
import { BedrockAgentDrawer } from '../components/BedrockAgentDrawer';
import { Shield, Radio, Activity, ExternalLink, Sparkles } from 'lucide-react';

const hotspots = hotspotsJson.hotspots as unknown as Hotspot[];

export default function NirnayDashboard() {
  const [rainMm, setRainMm] = useState<number>(45);
  const [durationHours, setDurationHours] = useState<number>(3.0);
  const [activePreset, setActivePreset] = useState<'JULY_2026' | 'MAY_2025' | null>(null);
  const [selectedHotspotId, setSelectedHotspotId] = useState<string>('delhi-minto-bridge');
  const [availablePumps, setAvailablePumps] = useState<number>(5);
  const [availableCrews, setAvailableCrews] = useState<number>(2);
  const [interventions, setInterventions] = useState<Record<string, Intervention>>({});
  const [allocationResult, setAllocationResult] = useState<AllocationResult | null>(null);
  const [isOptimizing, setIsOptimizing] = useState<boolean>(false);

  // Zero-latency client-side simulation (60 FPS on slider move)
  const simulation = useMemo(() => {
    return runSimulationClient(hotspots, rainMm, durationHours, interventions);
  }, [rainMm, durationHours, interventions]);

  const selectedHotspot = useMemo(() => {
    return hotspots.find((h) => h.id === selectedHotspotId) || hotspots[0];
  }, [selectedHotspotId]);

  const selectedResult = useMemo(() => {
    return simulation.hotspots[selectedHotspot.id] || {
      id: selectedHotspot.id,
      name: selectedHotspot.name,
      maxDepthM: 0,
      timeToAlertMins: null,
      timeToClosureMins: null,
      closureDurationMins: 0,
      impactScore: 0,
      depthSeries: [],
      status: 'OPEN',
    };
  }, [simulation, selectedHotspot]);

  // Handle Dynamic Programming optimization
  const handleRunOptimization = async () => {
    setIsOptimizing(true);
    try {
      const res = await optimizeAllocationDualMode(
        hotspots,
        rainMm,
        durationHours,
        availablePumps,
        availableCrews
      );
      setAllocationResult(res);
      setInterventions(res.allocations);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleUpdateIntervention = (newInterv: Intervention) => {
    setInterventions((prev) => ({
      ...prev,
      [selectedHotspot.id]: newInterv,
    }));
  };

  // Metrics overview count
  const closedCount = Object.values(simulation.hotspots).filter((h) => h.status === 'CLOSED').length;
  const alertCount = Object.values(simulation.hotspots).filter((h) => h.status === 'ALERT').length;
  const openCount = Object.values(simulation.hotspots).filter((h) => h.status === 'OPEN').length;

  return (
    <div className="flex flex-col min-h-screen bg-slate-950 text-slate-100">
      {/* Top Navbar */}
      <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-50 px-5 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shadow-lg shadow-blue-500/20">
            <Shield className="w-5 h-5 text-slate-950 font-bold" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="font-extrabold text-sm tracking-tight text-white flex items-center gap-1.5">
                NIRNAY <span className="text-cyan-400 font-mono text-xs">(निर्णय)</span>
              </h1>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/20 font-mono">
                PWD Tactical Command Center
              </span>
            </div>
            <p className="text-[11px] text-slate-400">Pre-Storm Flash-Flood Sim & Fleet Allocation Engine</p>
          </div>
        </div>

        {/* Live Status Indicators */}
        <div className="flex items-center gap-4 text-xs font-mono">
          <div className="flex items-center gap-3 bg-slate-900 border border-slate-800 px-3 py-1.5 rounded-lg">
            <span className="flex items-center gap-1 text-emerald-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-400"></span> {openCount} Safe
            </span>
            <span className="flex items-center gap-1 text-amber-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-amber-400"></span> {alertCount} Alert
            </span>
            <span className="flex items-center gap-1 text-rose-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse"></span> {closedCount} Closed
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2 text-slate-400">
            <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-cyan-300">
              <Sparkles className="w-3 h-3 text-cyan-400" /> AWS Bedrock Live
            </span>
            <span className="flex items-center gap-1 text-[11px] px-2.5 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400">
              <Radio className="w-3 h-3 text-emerald-400 animate-pulse" /> 60 FPS Local Port
            </span>
          </div>
        </div>
      </header>

      {/* Main Split-Screen Workspace */}
      <main className="flex-1 p-4 grid grid-cols-1 lg:grid-cols-12 gap-4 max-w-[1700px] w-full mx-auto">
        
        {/* Left: Tactical Map View (65% width / 8 cols) */}
        <div className="lg:col-span-7 xl:col-span-8 flex flex-col space-y-4">
          <div className="flex-1 min-h-[520px]">
            <TacticalMap
              hotspots={hotspots}
              results={simulation.hotspots}
              selectedHotspotId={selectedHotspot.id}
              onSelectHotspot={(id) => setSelectedHotspotId(id)}
            />
          </div>

          {/* Bottom Rainfall Scrubber Controls */}
          <RainfallScrubber
            rainMm={rainMm}
            durationHours={durationHours}
            onUpdateRain={(mm, dur) => {
              setRainMm(mm);
              setDurationHours(dur);
            }}
            activePreset={activePreset}
            onSelectPreset={(p) => setActivePreset(p)}
          />
        </div>

        {/* Right: Operations & Inspection Panel (35% width / 4-5 cols) */}
        <div className="lg:col-span-5 xl:col-span-4 flex flex-col space-y-4 overflow-y-auto">
          {/* Selected Underpass Inspection Gauge */}
          <UnderpassGauge
            hotspot={selectedHotspot}
            result={selectedResult}
            intervention={interventions[selectedHotspot.id] || { tempPumps: 0, drainCleared: false, preDivert: false, roadClosed: false }}
            onUpdateIntervention={handleUpdateIntervention}
          />

          {/* Fleet Resource Allocation Console */}
          <AllocationConsole
            availablePumps={availablePumps}
            availableCrews={availableCrews}
            onChangePumps={(n) => setAvailablePumps(n)}
            onChangeCrews={(m) => setAvailableCrews(m)}
            onRunOptimization={handleRunOptimization}
            isOptimizing={isOptimizing}
            result={allocationResult}
          />

          {/* AWS Bedrock Operational Briefing & Strands Chat Drawer */}
          <BedrockAgentDrawer
            currentScenario={{
              rainMm,
              durationHours,
              closureHoursSaved: allocationResult?.closureHoursSaved || 0,
            }}
          />
        </div>

      </main>

      {/* Footer Status Bar */}
      <footer className="border-t border-slate-900 bg-slate-950 px-5 py-2.5 text-xs text-slate-500 font-mono flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-3">
          <span>Track: Heat & Water</span>
          <span>•</span>
          <span>WeMakeDevs x AWS Environmental Hacks</span>
          <span>•</span>
          <span>Team DTU</span>
        </div>
        <div className="flex items-center gap-4 text-[11px]">
          <span className="text-slate-400">Ground Truth: Copernicus DEM + PWD Hotspots Archive</span>
          <span className="text-cyan-400">Deployable on AWS Amplify</span>
        </div>
      </footer>
    </div>
  );
}
