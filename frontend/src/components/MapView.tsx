import React, { useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import { useStore, getPinStatus } from '@/store/useStore';
import { MAP_CENTER, MAP_ZOOM, MAP_TILE_URL, MAP_ATTRIBUTION, PIN_COLORS } from '@/config';
import hotspotData from '@/data/hotspots.json';
import type { Hotspot } from '@/types';

const hotspotsList: Hotspot[] = hotspotData.hotspots as Hotspot[];

export const MapView: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const markersRef = useRef<maplibregl.Marker[]>([]);

  const selectedHotspotId = useStore((s) => s.selectedHotspotId);
  const selectHotspot = useStore((s) => s.selectHotspot);
  const simResults = useStore((s) => s.simResults);
  const closureDeltas = useStore((s) => s.closureDeltas);

  // Initialize MapLibre
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

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

    // Check if hospital route coordinates exist in data
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

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Update Markers whenever simulation results or selected hotspot changes
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    // Clear existing markers
    markersRef.current.forEach((m) => m.remove());
    markersRef.current = [];

    // Render every hotspot as a small colored circle
    hotspotsList.forEach((hotspot) => {
      const sim = simResults[hotspot.id] || {
        minutesToAlert: Infinity,
        minutesToClosure: Infinity,
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

      // Label the selected hotspot, closed hotspots, or any hotspot with an active delta
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
        map.flyTo({
          center: [hotspot.lon, hotspot.lat],
          zoom: Math.max(map.getZoom(), 12.5),
          duration: 600,
        });
      });

      const marker = new maplibregl.Marker({ element: el })
        .setLngLat([hotspot.lon, hotspot.lat])
        .addTo(map);

      markersRef.current.push(marker);
    });
  }, [simResults, selectedHotspotId, selectHotspot, closureDeltas]);

  return (
    <div className="relative w-full h-full">
      <div ref={mapContainerRef} className="w-full h-full" />

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
