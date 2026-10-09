import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import TopBar from '../components/TopBar';
import MapView from '../components/MapView';
import RightPanel from '../components/RightPanel';
import RainfallBar from '../components/RainfallBar';
import Footer from '../components/Footer';
import { useStore } from '../store/useStore';
import hotspotData from '../data/hotspots.json';
import type { Hotspot } from '../types';

const hotspotsList: Hotspot[] = hotspotData.hotspots as Hotspot[];

export const Simulator: React.FC = () => {
  const [mobileSheetOpen, setMobileSheetOpen] = useState(false);
  const [searchParams] = useSearchParams();

  const applyPreset = useStore((s) => s.applyPreset);
  const selectHotspot = useStore((s) => s.selectHotspot);

  // Deep-link preset and scenario resolution on mount
  useEffect(() => {
    const preset = searchParams.get('preset');
    if (preset === 'july2026') {
      applyPreset(180, 6);
    } else if (preset === 'may2025') {
      applyPreset(65, 3);
    }

    const scenarioId = searchParams.get('scenario');
    if (scenarioId) {
      // If scenario matches a hotspot id or name slug, select it
      const matched = hotspotsList.find(
        (h) => h.id === scenarioId || h.id.replace('delhi-', '') === scenarioId
      );
      if (matched) {
        selectHotspot(matched.id);
      }
    }
  }, [searchParams, applyPreset, selectHotspot]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-surface text-primary">
      {/* Top Bar */}
      <TopBar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row relative overflow-hidden">
        {/* Left Map Area (65% on desktop, full-screen on mobile) */}
        <main className="flex-1 md:w-[65%] h-full relative">
          <MapView />

          {/* Mobile Bottom Sheet Toggle Pill */}
          <div className="md:hidden absolute top-4 right-4 z-20">
            <button
              onClick={() => setMobileSheetOpen(!mobileSheetOpen)}
              className="bg-white/95 text-text-primary px-3 py-1.5 rounded-sm border border-border shadow-md text-[13px] font-medium flex items-center gap-1.5"
            >
              <svg
                className="w-4 h-4 text-primary"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d={
                    mobileSheetOpen
                      ? 'M6 18L18 6M6 6l12 12'
                      : 'M4 6h16M4 12h16M4 18h16'
                  }
                />
              </svg>
              <span>{mobileSheetOpen ? 'Close Panel' : 'Operations'}</span>
            </button>
          </div>
        </main>

        {/* Right Operations Panel (35% on desktop, bottom sheet on mobile) */}
        <div
          className={`
            fixed md:relative inset-x-0 bottom-0 z-30 md:z-auto
            h-[82vh] md:h-full md:w-[35%] max-w-full md:max-w-none
            transition-transform duration-300 ease-in-out
            bg-white shadow-xl md:shadow-none
            ${mobileSheetOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}
          `}
        >
          {/* Mobile Handle Bar */}
          <div
            className="md:hidden w-full py-2 flex justify-center border-b border-border bg-[#F8F9FA] cursor-pointer"
            onClick={() => setMobileSheetOpen(false)}
          >
            <div className="w-12 h-1.5 bg-gray-300 rounded-full" />
          </div>

          <RightPanel />
        </div>
      </div>

      {/* Rainfall Controls Bar */}
      <RainfallBar />

      {/* Footer Advisory */}
      <Footer />
    </div>
  );
};

export default Simulator;
