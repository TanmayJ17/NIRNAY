'use client';

import React, { useEffect, useRef } from 'react';
import { Hotspot, HotspotSimulationResult } from '../engine/simulator';

interface TacticalMapProps {
  hotspots: Hotspot[];
  results: Record<string, HotspotSimulationResult>;
  selectedHotspotId: string;
  onSelectHotspot: (id: string) => void;
}

export const TacticalMap: React.FC<TacticalMapProps> = ({
  hotspots,
  results,
  selectedHotspotId,
  onSelectHotspot,
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<Record<string, any>>({});

  useEffect(() => {
    if (typeof window === 'undefined' || !mapContainerRef.current) return;

    let isMounted = true;

    // Dynamically import Leaflet to prevent Next.js SSR errors
    import('leaflet').then((L) => {
      if (!isMounted || mapInstanceRef.current) return;

      // Add Leaflet CSS if not already present
      if (!document.getElementById('leaflet-css')) {
        const link = document.createElement('link');
        link.id = 'leaflet-css';
        link.rel = 'stylesheet';
        link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
        document.head.appendChild(link);
      }

      // Initialize Leaflet Map centered on Central Delhi Ring Road
      const map = L.map(mapContainerRef.current!, {
        center: [28.630, 77.215],
        zoom: 12,
        zoomControl: false,
      });

      L.control.zoom({ position: 'topright' }).addTo(map);

      // CartoDB Dark Matter Tiles (Zero API key, free, fast)
      L.tileLayer(
        'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
        {
          attribution: '&copy; OpenStreetMap contributors &copy; CARTO',
          maxZoom: 18,
          subdomains: 'abcd',
        }
      ).addTo(map);

      // Draw Cyan Trauma Corridor along Delhi Ring Road connecting major hospitals
      const traumaRouteCoords: [number, number][] = [
        [28.5921, 77.1565], // Dhaula Kuan
        [28.5672, 77.2100], // AIIMS
        [28.5684, 77.2343], // Moolchand
        [28.5710, 77.2580], // Ashram
        [28.6290, 77.2480], // WHO Ring Road
        [28.6329, 77.2205], // Minto / LNJP
      ];

      L.polyline(traumaRouteCoords, {
        color: '#06b6d4',
        weight: 3,
        opacity: 0.8,
        dashArray: '6, 8',
      }).addTo(map);

      mapInstanceRef.current = map;

      // Add Markers
      hotspots.forEach((hp) => {
        const res = results[hp.id];
        const status = res?.status || 'OPEN';
        const isSelected = hp.id === selectedHotspotId;

        const colorClass =
          status === 'CLOSED'
            ? 'bg-rose-500 shadow-rose-500/80 animate-pulse'
            : status === 'ALERT'
            ? 'bg-amber-400 shadow-amber-400/80 animate-bounce'
            : 'bg-emerald-400 shadow-emerald-400/80';

        const customIcon = L.divIcon({
          className: 'custom-beacon-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 28px; height: 28px; cursor: pointer;">
              <div style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; opacity: 0.35; background-color: ${
                status === 'CLOSED' ? '#f43f5e' : status === 'ALERT' ? '#fbbf24' : '#10b981'
              }; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 14px; height: 14px; border-radius: 9999px; border: 2px solid #ffffff; ${
                isSelected ? 'box-shadow: 0 0 15px 4px #38bdf8;' : ''
              }" class="${colorClass}"></div>
            </div>
          `,
          iconSize: [28, 28],
          iconAnchor: [14, 14],
        });

        const marker = L.marker([hp.lat, hp.lon], { icon: customIcon })
          .addTo(map)
          .on('click', () => {
            onSelectHotspot(hp.id);
          });

        markersRef.current[hp.id] = marker;
      });
    });

    return () => {
      isMounted = false;
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, []);

  // Update marker icons dynamically on rainfall simulation updates
  useEffect(() => {
    if (!mapInstanceRef.current || typeof window === 'undefined') return;

    import('leaflet').then((L) => {
      hotspots.forEach((hp) => {
        const marker = markersRef.current[hp.id];
        if (!marker) return;

        const res = results[hp.id];
        const status = res?.status || 'OPEN';
        const isSelected = hp.id === selectedHotspotId;

        const colorHex =
          status === 'CLOSED' ? '#f43f5e' : status === 'ALERT' ? '#fbbf24' : '#10b981';

        const newIcon = L.divIcon({
          className: 'custom-beacon-marker',
          html: `
            <div style="position: relative; display: flex; align-items: center; justify-content: center; width: 30px; height: 30px; cursor: pointer;">
              <div style="position: absolute; width: 24px; height: 24px; border-radius: 9999px; opacity: 0.4; background-color: ${colorHex}; animation: ping 2s cubic-bezier(0, 0, 0.2, 1) infinite;"></div>
              <div style="width: 14px; height: 14px; border-radius: 9999px; border: 2px solid #ffffff; background-color: ${colorHex}; ${
            isSelected ? 'box-shadow: 0 0 16px 5px #38bdf8; transform: scale(1.3);' : ''
          }"></div>
            </div>
          `,
          iconSize: [30, 30],
          iconAnchor: [15, 15],
        });

        marker.setIcon(newIcon);
      });
    });
  }, [results, selectedHotspotId]);

  return (
    <div className="relative w-full h-full min-h-[500px] rounded-xl overflow-hidden border border-slate-800 bg-slate-950">
      <div ref={mapContainerRef} className="w-full h-full" style={{ minHeight: '520px' }} />

      {/* Map Legend Overlay */}
      <div className="absolute top-3 left-3 z-[1000] bg-slate-950/85 backdrop-blur-md border border-slate-800 p-2.5 rounded-lg text-xs font-mono space-y-1.5 shadow-xl">
        <div className="text-[10px] uppercase font-bold text-slate-400">Underpass Threat State:</div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-400"></span>
          <span className="text-slate-300 text-[11px]">Clear (&lt;6" water)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-amber-400"></span>
          <span className="text-slate-300 text-[11px]">Alert (6" warning)</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-pulse"></span>
          <span className="text-slate-300 text-[11px]">Closed (&gt;8" submerged)</span>
        </div>
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800">
          <span className="w-3.5 h-0.5 bg-cyan-400"></span>
          <span className="text-cyan-300 text-[10px]">Trauma Hospital Corridor</span>
        </div>
      </div>
    </div>
  );
};
