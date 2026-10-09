import React, { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import { useStore, getPinStatus } from '@/store/useStore';
import { MAP_CENTER, MAP_ZOOM, MAP_TILE_URL, MAP_ATTRIBUTION, PIN_COLORS } from '@/config';
import { hotspots } from '@/data/loadHotspots';
import hotspotData from '@/data/hotspots.json';

export const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);

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
        style: {
          version: 8,
          sources: {
            'carto-light': {
              type: 'raster',
              tiles: [MAP_TILE_URL],
              tileSize: 256,
              attribution: MAP_ATTRIBUTION,
            },
          },
          layers: [
            {
              id: 'carto-light-tiles',
              type: 'raster',
              source: 'carto-light',
              minzoom: 0,
              maxzoom: 20,
            },
          ],
        },
        center: MAP_CENTER,
        zoom: MAP_ZOOM,
        attributionControl: false,
      });

      map.on('error', (e) => {
        // Non-fatal tile warnings shouldn't break the UI, but log them
        if (e.error?.message?.includes('WebGL') || e.error?.message?.includes('context')) {
          setMapError('MapLibre WebGL context could not be initialized.');
        }
      });

      // Add navigation control (+ / - buttons at top right)
      map.addControl(
        new maplibregl.NavigationControl({ showCompass: false }),
        'top-right'
      );

      // Add attribution at bottom right
      map.addControl(
        new maplibregl.AttributionControl({ compact: true }),
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
              'line-color': '#1D4ED8',
              'line-width': 3,
              'line-opacity': 0.85,
            },
          });
        }
      });

      mapRef.current = map;
    } catch (err: any) {
      console.warn('Map initialization fallback triggered:', err);
      setMapError(err?.message || 'Map rendering unavailable');
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

    // Render every hotspot from loadHotspots as a small colored circle
    hotspots.forEach((hotspot) => {
      const sim = simResults[hotspot.id] || {
        minutesToAlert: null,
        minutesToClosure: null,
        closureMinutes: 0,
        maxDepthM: 0,
        impactIndex: 0,
      };

      const status = getPinStatus(sim);
      const isClosed = status === 'red';
      const isSelected = hotspot.id === selectedHotspotId;
      const activeDelta = closureDeltas[hotspot.id];

      // Color mapping
      const markerColor =
        status === 'red'
          ? PIN_COLORS.red
          : status === 'amber'
          ? PIN_COLORS.amber
          : PIN_COLORS.green;

      // Create custom DOM marker
      const el = document.createElement('div');
      el.className = 'cursor-pointer group flex items-center relative';

      // Pin circle
      const dot = document.createElement('div');
      dot.className =
        'w-3.5 h-3.5 rounded-full border-2 border-white shadow-sm transition-transform hover:scale-125';
      dot.style.backgroundColor = markerColor;
      if (isSelected) {
        dot.className += ' ring-2 ring-primary ring-offset-1 scale-125';
      }
      el.appendChild(dot);

      // Labels for selected, closed, and active delta
      if (isSelected || isClosed || activeDelta) {
        const label = document.createElement('div');
        label.className =
          'absolute left-4 top-1/2 -translate-y-1/2 whitespace-nowrap bg-white/95 px-2 py-0.5 rounded text-[11px] font-medium border border-border shadow-sm flex items-center gap-1.5 pointer-events-none z-10';

        const labelText = document.createElement('span');
        labelText.textContent = hotspot.name.replace(' Underpass', '').replace(' Flyover', '');
        labelText.className = 'text-text-primary';
        label.appendChild(labelText);

        if (isClosed) {
          const closedBadge = document.createElement('span');
          closedBadge.textContent = 'Closed';
          closedBadge.className = 'text-status-red font-semibold text-[10px]';
          label.appendChild(closedBadge);
        }

        if (activeDelta) {
          const deltaBadge = document.createElement('span');
          deltaBadge.textContent = `(${activeDelta})`;
          deltaBadge.className = 'text-primary font-mono text-[10px] font-semibold';
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
        <div className="absolute inset-0 bg-[#F3F4F6] p-6 flex flex-col items-center justify-center text-center z-20">
          <div className="max-w-md bg-white border border-border rounded-sm p-4 shadow-sm">
            <h3 className="text-[13px] font-semibold text-text-primary mb-1">
              Interactive Map Fallback Mode
            </h3>
            <p className="text-[11px] text-text-muted mb-3 leading-relaxed">
              MapLibre tiles unavailable. Hydrological simulator and dispatch optimization remain fully operational.
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

      {/* Hotspot Status Legend (Bottom-Left) */}
      <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur-sm border border-border rounded-sm p-3 shadow-sm select-none z-10">
        <div className="text-[10px] font-semibold tracking-wider text-text-secondary uppercase mb-2">
          HOTSPOT STATUS LEGEND
        </div>
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: PIN_COLORS.green }}
            />
            <span className="text-text-secondary">Clear (&lt;60 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: PIN_COLORS.amber }}
            />
            <span className="text-text-secondary">Alert (&lt;60 min)</span>
          </div>
          <div className="flex items-center gap-2">
            <span
              className="w-2.5 h-2.5 rounded-full shrink-0"
              style={{ backgroundColor: PIN_COLORS.red }}
            />
            <span className="text-text-secondary">Closed (Depth &gt;20cm)</span>
          </div>
          <div className="flex items-center gap-2 pt-1 border-t border-border/60">
            <span className="w-3.5 h-0.5 bg-primary rounded-full shrink-0" />
            <span className="text-text-secondary">Hospital route</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapView;
