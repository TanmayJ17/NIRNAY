import React, { useEffect, useRef, useState } from 'react';
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
  const [isLegendOpen, setIsLegendOpen] = useState(false);

  const selectedHotspotId = useStore((s) => s.selectedHotspotId);
  const selectHotspot = useStore((s) => s.selectHotspot);
  const simResults = useStore((s) => s.simResults);
  const closureDeltas = useStore((s) => s.closureDeltas);

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
        // Catch WebGL, context or style loading errors
        if (
          e.error?.message?.includes('WebGL') ||
          e.error?.message?.includes('context') ||
          e.error?.message?.includes('style')
        ) {
          setMapError('Map unavailable');
        }
      });

      // Add navigation control (+ / - buttons at top right)
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'top-right'
      );

      // Add attribution at bottom right
      map.addControl(
        new maplibregl.AttributionControl({
          compact: true,
          customAttribution: MAP_ATTRIBUTION,
        }),
        'bottom-right'
      );

      // Add hospital route geometry if available
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
              'line-color': '#1D6FB8',
              'line-width': 3,
              'line-opacity': 0.85,
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

  // Update Markers whenever simulation results or selected hotspot changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map || mapError) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Render every hotspot with distinct shape + colour cues
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

      // Create custom DOM marker wrapper
      const el = document.createElement('div');
      el.className = 'cursor-pointer group flex items-center relative';

      // Shape cue + Colour:
      // Clear = Circle
      // Alert = Triangle
      // Closed = Square
      if (status === 'green') {
        const circle = document.createElement('div');
        circle.className = `w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-125 ${
          isSelected ? 'ring-2 ring-accent ring-offset-1 scale-125' : ''
        }`;
        circle.style.backgroundColor = PIN_COLORS.green;
        el.appendChild(circle);
      } else if (status === 'amber') {
        const triangle = document.createElement('div');
        triangle.className = `w-4 h-4 flex items-center justify-center transition-transform hover:scale-125 ${
          isSelected ? 'scale-125' : ''
        }`;
        triangle.innerHTML = `
          <svg viewBox="0 0 20 20" class="w-4 h-4 ${isSelected ? 'stroke-accent stroke-2' : ''}" style="filter: drop-shadow(0 1px 1px rgba(0,0,0,0.15))">
            <polygon points="10,2 18,17 2,17" fill="${PIN_COLORS.amber}" stroke="#FFFFFF" stroke-width="1.5" />
          </svg>
        `;
        el.appendChild(triangle);
      } else {
        // Red closed square
        const square = document.createElement('div');
        square.className = `w-3.5 h-3.5 rounded-[1px] border-2 border-white shadow-sm transition-transform hover:scale-125 ${
          isSelected ? 'ring-2 ring-accent ring-offset-1 scale-125' : ''
        }`;
        square.style.backgroundColor = PIN_COLORS.red;
        el.appendChild(square);
      }

      // Marker labels: ONLY the selected hotspot is labelled
      if (isSelected) {
        const label = document.createElement('div');
        label.className =
          'absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap bg-surface px-2 py-0.5 rounded text-[11px] font-medium border border-border shadow-sm flex items-center gap-1.5 pointer-events-none z-10 text-ink';

        const labelText = document.createElement('span');
        labelText.textContent = hotspot.name.replace(' Underpass', '').replace(' Flyover', '');
        labelText.className = 'font-semibold text-ink';
        label.appendChild(labelText);

        if (status === 'red') {
          const closedBadge = document.createElement('span');
          closedBadge.textContent = 'Closed';
          closedBadge.className = 'text-status-red font-semibold text-[10px]';
          label.appendChild(closedBadge);
        }

        if (activeDelta) {
          const deltaBadge = document.createElement('span');
          deltaBadge.textContent = `(${activeDelta})`;
          deltaBadge.className = 'text-accent font-mono text-[10px] font-semibold';
          label.appendChild(deltaBadge);
        }

        el.appendChild(label);
      }

      el.addEventListener('click', (e) => {
        e.stopPropagation();
        selectHotspot(hotspot.id);
        if (mapRef.current) {
          mapRef.current.flyTo({
            center: [hotspot.lon, hotspot.lat],
            zoom: Math.max(mapRef.current.getZoom(), 12.5),
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

  return (
    <div className="relative w-full h-full bg-[#f8f9fa]">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Fallback View if MapLibre fails */}
      {mapError && (
        <div className="absolute inset-0 bg-[#EEF2F6] p-6 flex flex-col items-center justify-center text-center z-20">
          <div className="max-w-md bg-white border border-border rounded-sm p-4 shadow-sm">
            <h3 className="text-[13px] font-semibold text-text-primary mb-1">
              Hotspots Overview
            </h3>
            <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
              Map unavailable. Hydrological simulator and dispatch optimization remain fully operational.
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
                    className={`p-2 border rounded-sm text-[11px] text-left transition-colors flex items-center justify-between ${
                      h.id === selectedHotspotId
                        ? 'border-primary bg-blue-50/50'
                        : 'border-border bg-white hover:bg-surface'
                    }`}
                  >
                    <span className="font-medium text-text-primary truncate">
                      {h.name.replace(' Underpass', '')}
                    </span>
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

      {/* Collapsible Hotspot Status Legend (Bottom-Left Corner) */}
      <div className="absolute bottom-4 left-4 bg-surface/95 backdrop-blur-sm border border-border rounded-sm shadow-sm select-none z-10 max-w-[220px]">
        {/* Header Toggle */}
        <button
          onClick={() => setIsLegendOpen(!isLegendOpen)}
          className="w-full flex items-center justify-between gap-2 p-2 text-[11px] font-semibold tracking-wider text-muted uppercase hover:bg-canvas transition-colors cursor-pointer"
        >
          <div className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-accent" />
            <span>Map Legend</span>
          </div>
          <svg
            className={`w-3 h-3 text-muted transition-transform ${isLegendOpen ? 'rotate-180' : ''}`}
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Collapsible Content */}
        {isLegendOpen && (
          <div className="p-2.5 pt-1 space-y-2 text-[11px] border-t border-border/70">
            {/* Clear (Circle) */}
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-full shrink-0 border border-white"
                style={{ backgroundColor: PIN_COLORS.green }}
              />
              <span className="text-muted">
                <strong className="text-ink font-medium">Clear</strong>: stays below 6 in
              </span>
            </div>

            {/* Alert (Triangle) */}
            <div className="flex items-center gap-2">
              <svg viewBox="0 0 20 20" className="w-3 h-3 shrink-0">
                <polygon points="10,2 18,17 2,17" fill={PIN_COLORS.amber} />
              </svg>
              <span className="text-muted">
                <strong className="text-ink font-medium">Alert</strong>: reaches 6 in, below 8 in
              </span>
            </div>

            {/* Closed (Square) */}
            <div className="flex items-center gap-2">
              <span
                className="w-2.5 h-2.5 rounded-[1px] shrink-0 border border-white"
                style={{ backgroundColor: PIN_COLORS.red }}
              />
              <span className="text-muted">
                <strong className="text-ink font-medium">Closed</strong>: reaches 8 in
              </span>
            </div>

            {/* Hospital route line */}
            <div className="flex items-center gap-2 pt-1 border-t border-border/60">
              <span className="w-3.5 h-0.5 bg-accent rounded-full shrink-0" />
              <span className="text-muted">Hospital route</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapView;
