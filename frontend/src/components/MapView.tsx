import React, { useEffect, useRef, useState, useMemo } from 'react';
import maplibregl from 'maplibre-gl';
import { useStore, getPinStatus } from '@/store/useStore';
import { MAP_CENTER, MAP_ZOOM, MAP_STYLE_URL, MAP_ATTRIBUTION, PIN_COLORS } from '@/config';
import { hotspots } from '@/data/loadHotspots';
import hotspotData from '@/data/hotspots.json';

export const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isLegendOpen, setIsLegendOpen] = useState(true);
  const [showHospitalRoute, setShowHospitalRoute] = useState(true);

  const selectedHotspotId = useStore((s) => s.selectedHotspotId);
  const selectHotspot = useStore((s) => s.selectHotspot);
  const simResults = useStore((s) => s.simResults);
  const closureDeltas = useStore((s) => s.closureDeltas);

  // Status counters for top summary HUD
  const counts = useMemo(() => {
    let closed = 0;
    let alert = 0;
    let clear = 0;
    hotspots.forEach((h) => {
      const sim = simResults[h.id];
      if (!sim) {
        clear++;
        return;
      }
      const st = getPinStatus(sim);
      if (st === 'red') closed++;
      else if (st === 'amber') alert++;
      else clear++;
    });
    return { closed, alert, clear };
  }, [simResults]);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    try {
      const map = new maplibregl.Map({
        container: mapContainerRef.current,
        style: MAP_STYLE_URL,
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        attributionControl: false,
      });

      map.on('error', (e) => {
        if (
          e.error?.message?.includes('WebGL') ||
          e.error?.message?.includes('context') ||
          e.error?.message?.includes('style')
        ) {
          setMapError('Map unavailable');
        }
      });

      // Navigation controls (+/- zoom)
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'top-right'
      );

      // Attribution
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: MAP_ATTRIBUTION,
        }),
        'bottom-right'
      );

      // Add hospital lifeline route geometry
      map.on('load', () => {
        const dataWithRoute = hotspotData as {
          hospital_route_coordinates?: [number, number][];
        };
        if (
          dataWithRoute.hospital_route_coordinates &&
          Array.isArray(dataWithRoute.hospital_route_coordinates) &&
          dataWithRoute.hospital_route_coordinates.length > 1
        ) {
          map.addSource('hospital-route', {
            type: 'geojson',
            data: {
              type: 'Feature',
              properties: { name: 'Hospital access route' },
              geometry: {
                type: 'LineString',
                coordinates: dataWithRoute.hospital_route_coordinates,
              },
            },
          });

          map.addLayer({
            id: 'hospital-route-line',
            type: 'line',
            source: 'hospital-route',
            layout: {
              'line-join': 'round',
              'line-cap': 'round',
            },
            paint: {
              'line-color': '#DC2626',
              'line-width': 4,
              'line-opacity': 0.85,
              'line-dasharray': [2, 1],
            },
          });
        }
      });

      mapRef.current = map;
    } catch (err: any) {
      console.warn('Map initialization fallback triggered:', err);
      setMapError('Map unavailable');
    }

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
        mapRef.current = null;
      }
    };
  }, []);

  // Toggle Hospital Route Visibility
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !map.isStyleLoaded()) return;
    if (map.getLayer('hospital-route-line')) {
      map.setLayoutProperty(
        'hospital-route-line',
        'visibility',
        showHospitalRoute ? 'visible' : 'none'
      );
    }
  }, [showHospitalRoute]);

  // Update Markers: Render high-contrast, informative badges on ALL hotspots
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapError) return;

    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    hotspots.forEach((hotspot) => {
      const sim = simResults[hotspot.id] || {
        minutesToAlert: null,
        minutesToClosure: null,
        closureMinutes: 0,
        maxDepthM: 0,
        impactIndex: 0,
      };

      const status = getPinStatus(sim);
      const isSelected = hotspot.id === selectedHotspotId;
      const activeDelta = closureDeltas[hotspot.id];
      const cleanName = hotspot.name.replace(' Underpass', '').replace(' Flyover', '');

      // Create Custom Civic Marker Element
      const el = document.createElement('div');
      el.className = 'cursor-pointer select-none group relative transition-transform duration-150';

      // Outer Card Badge for the marker
      const badge = document.createElement('div');
      const isClosed = status === 'red';
      const isAlert = status === 'amber';

      badge.className = `flex items-center gap-1.5 px-2 py-1 rounded-sm shadow-md border text-[11px] font-medium transition-all ${
        isSelected
          ? 'bg-[#0F2B5C] text-white border-yellow-400 ring-2 ring-yellow-400 scale-110 z-30'
          : isClosed
          ? 'bg-red-50 text-red-950 border-red-500 hover:scale-105 z-20'
          : isAlert
          ? 'bg-amber-50 text-amber-950 border-amber-500 hover:scale-105 z-10'
          : 'bg-white text-gray-800 border-gray-300 hover:scale-105'
      }`;

      // Status indicator icon / dot with radar pulse on closed
      const dotContainer = document.createElement('div');
      dotContainer.className = 'relative flex items-center justify-center shrink-0 w-3 h-3';

      if (isClosed) {
        // Red Pulsing Radar Ripple
        dotContainer.innerHTML = `
          <span class="absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75 animate-ping"></span>
          <span class="relative inline-flex rounded-[2px] w-2.5 h-2.5 bg-red-600 border border-white"></span>
        `;
      } else if (isAlert) {
        // Amber warning triangle
        dotContainer.innerHTML = `
          <span class="relative inline-flex w-3 h-3 text-amber-600">
            <svg viewBox="0 0 20 20" fill="currentColor">
              <polygon points="10,2 19,17 1,17" />
            </svg>
          </span>
        `;
      } else {
        // Green circle dot
        dotContainer.innerHTML = `
          <span class="relative inline-flex rounded-full w-2.5 h-2.5 bg-emerald-600 border border-white"></span>
        `;
      }
      badge.appendChild(dotContainer);

      // Underpass name label
      const nameText = document.createElement('span');
      nameText.className = `font-bold tracking-tight whitespace-nowrap ${
        isSelected ? 'text-white' : 'text-gray-900'
      }`;
      nameText.textContent = cleanName;
      badge.appendChild(nameText);

      // Status Tag: CLOSED / ALERT / DEPTH
      if (isClosed) {
        const closedTag = document.createElement('span');
        closedTag.className = `text-[9px] font-extrabold uppercase px-1 rounded ${
          isSelected ? 'bg-red-500 text-white' : 'bg-red-600 text-white'
        }`;
        closedTag.textContent = 'CLOSED';
        badge.appendChild(closedTag);
      } else if (isAlert) {
        const alertTag = document.createElement('span');
        alertTag.className = `text-[9px] font-bold uppercase px-1 rounded ${
          isSelected ? 'bg-amber-400 text-gray-900' : 'bg-amber-500 text-white'
        }`;
        alertTag.textContent = 'ALERT';
        badge.appendChild(alertTag);
      }

      // Hospital icon badge if on emergency corridor
      if (hotspot.hospital_route) {
        const hospBadge = document.createElement('span');
        hospBadge.className = 'text-[10px]';
        hospBadge.title = 'Hospital Emergency Access Lifeline';
        hospBadge.textContent = '🏥';
        badge.appendChild(hospBadge);
      }

      // Delta tag (e.g. -1.2h)
      if (activeDelta) {
        const deltaTag = document.createElement('span');
        deltaTag.className = 'text-[9px] font-mono font-bold text-sky-400';
        deltaTag.textContent = activeDelta;
        badge.appendChild(deltaTag);
      }

      el.appendChild(badge);

      // Click handler to select and fly to hotspot
      el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectHotspot(hotspot.id);
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [hotspot.lon, hotspot.lat],
            zoom: Math.max(mapRef.current.getZoom(), 12.8),
            duration: 600,
          });
        }
      });

      try {
        const marker = new maplibregl.Marker({ element: el })
          .setLngLat([hotspot.lon, hotspot.lat])
          .addTo(map);

        markersRef.current.push(marker);
      } catch (mErr) {
        console.warn('Marker attach error:', mErr);
      }
    });
  }, [simResults, selectedHotspotId, selectHotspot, closureDeltas, mapError]);

  // Jump to Hotspot helper
  const handleJumpToHotspot = (hId: string, lon: number, lat: number) => {
    selectHotspot(hId);
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: [lon, lat],
        zoom: 13.5,
        duration: 700,
      });
    }
  };

  // Reset view to entire Delhi
  const handleResetView = () => {
    if (mapRef.current) {
      mapRef.current.flyTo({
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        duration: 800,
      });
    }
  };

  return (
    <div className="relative w-full h-full bg-[#E5E7EB]">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* TOP FLOATING BAR: QUICK HOTSPOT JUMP SELECTOR */}
      <div className="absolute top-3 inset-x-3 sm:inset-x-6 z-10 pointer-events-none flex flex-col gap-2">
        <div className="bg-white/95 backdrop-blur-md border border-gray-300 rounded-sm shadow-md px-3 py-2 pointer-events-auto flex items-center justify-between gap-3 overflow-x-auto panel-scroll">
          <div className="flex items-center gap-2 shrink-0">
            <span className="text-[12px] font-bold text-[#0F2B5C] whitespace-nowrap flex items-center gap-1">
              <span>📍</span>
              <span>Hotspots ({hotspots.length}):</span>
            </span>
          </div>

          {/* Quick-Jump Hotspot Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto panel-scroll py-0.5">
            {hotspots.map((h) => {
              const sim = simResults[h.id];
              const st = sim ? getPinStatus(sim) : 'green';
              const isSel = h.id === selectedHotspotId;
              const cleanName = h.name.replace(' Underpass', '').replace(' Flyover', '');

              return (
                <button
                  key={h.id}
                  onClick={() => handleJumpToHotspot(h.id, h.lon, h.lat)}
                  className={`px-2 py-1 rounded text-[11px] font-medium whitespace-nowrap transition-colors flex items-center gap-1.5 cursor-pointer border ${
                    isSel
                      ? 'bg-[#0F2B5C] text-white border-[#0F2B5C] shadow-xs'
                      : st === 'red'
                      ? 'bg-red-50 text-red-900 border-red-300 hover:bg-red-100'
                      : st === 'amber'
                      ? 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100'
                      : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-100'
                  }`}
                  title={`${h.name} (${st.toUpperCase()})`}
                >
                  <span
                    className={`w-2 h-2 rounded-full shrink-0 ${
                      st === 'red'
                        ? 'bg-red-600 animate-ping'
                        : st === 'amber'
                        ? 'bg-amber-500'
                        : 'bg-emerald-500'
                    }`}
                  />
                  <span>{cleanName}</span>
                </button>
              );
            })}
          </div>

          {/* Reset View Button */}
          <button
            onClick={handleResetView}
            className="px-2.5 py-1 text-[11px] font-semibold text-gray-700 hover:text-[#0F2B5C] bg-gray-100 hover:bg-gray-200 rounded border border-gray-300 shrink-0 cursor-pointer"
            title="Reset to full Delhi View"
          >
            Zoom Delhi
          </button>
        </div>
      </div>

      {/* TOP-RIGHT CIVIC STATUS HUD & LAYER TOGGLES */}
      <div className="absolute top-16 right-3 z-10 flex flex-col gap-2 select-none">
        {/* Status Counts Card */}
        <div className="bg-white/95 backdrop-blur-md border border-gray-300 rounded-sm shadow-md p-2.5 text-[11px] flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-red-700 font-bold">
            <span className="w-2.5 h-2.5 rounded-[1px] bg-red-600 inline-block" />
            <span>Closed: {counts.closed}</span>
          </div>
          <div className="h-3 w-px bg-gray-300" />
          <div className="flex items-center gap-1.5 text-amber-700 font-semibold">
            <span className="w-2.5 h-2.5 bg-amber-500 inline-block" />
            <span>Alert: {counts.alert}</span>
          </div>
          <div className="h-3 w-px bg-gray-300" />
          <div className="flex items-center gap-1.5 text-emerald-700 font-semibold">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
            <span>Clear: {counts.clear}</span>
          </div>
        </div>

        {/* Layer Toggles */}
        <div className="bg-white/95 backdrop-blur-md border border-gray-300 rounded-sm shadow-md p-2 text-[11px] space-y-1.5">
          <label className="flex items-center justify-between gap-3 cursor-pointer text-gray-700 font-medium">
            <span className="flex items-center gap-1">
              <span>🏥</span>
              <span>Hospital Lifeline Corridors</span>
            </span>
            <input
              type="checkbox"
              checked={showHospitalRoute}
              onChange={(e) => setShowHospitalRoute(e.target.checked)}
              className="rounded text-red-600 focus:ring-0 cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* Fallback View if MapLibre fails */}
      {mapError && (
        <div className="absolute inset-0 bg-[#EEF2F6] p-6 flex flex-col items-center justify-center text-center z-20">
          <div className="max-w-md bg-white border border-gray-300 rounded-sm p-4 shadow-sm">
            <h3 className="text-[14px] font-bold text-[#0F2B5C] mb-1">
              Delhi Hotspots Control Table
            </h3>
            <p className="text-[11px] text-gray-600 mb-3 leading-relaxed">
              Hydrological simulation and pump dispatch remain fully operational.
            </p>
            <div className="grid grid-cols-2 gap-2 text-left max-h-60 overflow-y-auto panel-scroll">
              {hotspots.map((h) => {
                const sim = simResults[h.id] || {
                  minutesToAlert: null,
                  minutesToClosure: null,
                  closureMinutes: 0,
                  maxDepthM: 0,
                  impactIndex: 0,
                };
                const status = getPinStatus(sim);
                return (
                  <button
                    key={h.id}
                    onClick={() => selectHotspot(h.id)}
                    className={`p-2 border rounded text-[11px] text-left transition-colors flex items-center justify-between ${
                      h.id === selectedHotspotId
                        ? 'border-[#0F2B5C] bg-blue-50 font-bold'
                        : 'border-gray-200 bg-white hover:bg-gray-50'
                    }`}
                  >
                    <span className="truncate">{h.name.replace(' Underpass', '')}</span>
                    <span
                      className="w-2 h-2 rounded-full shrink-0"
                      style={{
                        backgroundColor:
                          status === 'red'
                            ? PIN_COLORS.red
                            : status === 'amber'
                            ? PIN_COLORS.amber
                            : PIN_COLORS.green,
                      }}
                    />
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Collapsible Hotspot Status Legend (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-md border border-gray-300 rounded-sm shadow-md select-none z-10 max-w-[240px]">
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="w-full flex items-center justify-between gap-2 p-2 text-[11px] font-bold tracking-wider text-[#0F2B5C] uppercase hover:bg-gray-50 transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-[#0F2B5C]" />
            <span>MCD Map Legend</span>
          </div>
          <svg
            className={`w-3.5 h-3.5 text-gray-500 transition-transform ${isLegendOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {isLegendOpen && (
          <div className="p-2.5 pt-1 space-y-2 text-[11px] border-t border-gray-200">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 shrink-0" />
              <span className="text-gray-700">
                <strong className="text-gray-900 font-bold">Clear</strong>: Depth &lt; 0.15m (Normal)
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 bg-amber-500 shrink-0" />
              <span className="text-gray-700">
                <strong className="text-gray-900 font-bold">Alert</strong>: Depth 0.15m – 0.20m
              </span>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-[1px] bg-red-600 shrink-0" />
              <span className="text-gray-700">
                <strong className="text-gray-900 font-bold">Closed</strong>: Depth &gt; 0.20m (Submerged)
              </span>
            </div>

            <div className="flex items-center gap-2 pt-1 border-t border-gray-200">
              <span className="w-3.5 h-1 bg-red-600 rounded-full shrink-0" />
              <span className="text-gray-700">Hospital Emergency Lifeline</span>
            </div>

            <div className="text-[10px] text-gray-500 pt-1 border-t border-gray-100">
              Copernicus DEM 30m terrain elevations mapped to gravity storm culverts.
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
