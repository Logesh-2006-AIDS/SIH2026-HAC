import React, { useEffect, useMemo, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet.heat';
import { CircleMarker, GeoJSON, MapContainer, Marker, Popup, TileLayer, useMap } from 'react-leaflet';
import { MapPin, Flame, Shield, RotateCcw, Crosshair, Zap, Compass, Radio, TrendingUp, TrendingDown, Repeat, Layers } from 'lucide-react';
import clsx from 'clsx';

// Strict Bounding Box focused purely on the Republic of India
const INDIA_BOUNDS = [
  [8.0, 68.0],
  [35.5, 97.4],
];

const INDIA_MAX_BOUNDS = [
  [6.5, 65.5],
  [37.2, 99.0],
];

const INDIA_CENTER = [22.8, 79.2];

// High-Visibility State Centroid Labels across India
const INDIAN_STATE_LABELS = [
  { name: 'DELHI NCR', lat: 28.6139, lon: 77.2090, isHub: true },
  { name: 'MAHARASHTRA', lat: 19.4500, lon: 75.8000, isHub: true },
  { name: 'GUJARAT', lat: 22.8000, lon: 71.8000, isHub: true },
  { name: 'UTTAR PRADESH', lat: 26.9000, lon: 80.9000, isHub: true },
  { name: 'KARNATAKA', lat: 14.8000, lon: 75.8000, isHub: true },
  { name: 'TAMIL NADU', lat: 11.1271, lon: 78.6569, isHub: true },
  { name: 'WEST BENGAL', lat: 23.8000, lon: 87.8000, isHub: true },
  { name: 'RAJASTHAN', lat: 26.6000, lon: 73.8000, isHub: true },
  { name: 'PUNJAB', lat: 31.1471, lon: 75.3412, isHub: true },
  { name: 'HARYANA', lat: 29.0588, lon: 76.0856, isHub: true },
  { name: 'TELANGANA', lat: 17.8000, lon: 79.1000, isHub: true },
  { name: 'ANDHRA PRADESH', lat: 15.5000, lon: 79.8000, isHub: false },
  { name: 'MADHYA PRADESH', lat: 23.5000, lon: 78.2000, isHub: false },
  { name: 'BIHAR', lat: 25.6000, lon: 85.8000, isHub: false },
  { name: 'JHARKHAND', lat: 23.6102, lon: 85.2799, isHub: false },
  { name: 'ODISHA', lat: 20.5000, lon: 84.4000, isHub: false },
  { name: 'CHHATTISGARH', lat: 21.2787, lon: 81.8661, isHub: false },
  { name: 'KERALA', lat: 10.4000, lon: 76.5000, isHub: false },
  { name: 'ASSAM', lat: 26.2006, lon: 92.9376, isHub: false },
  { name: 'UTTARAKHAND', lat: 30.0668, lon: 79.0193, isHub: false },
  { name: 'HIMACHAL PRADESH', lat: 31.8000, lon: 77.2000, isHub: false },
  { name: 'JAMMU & KASHMIR', lat: 33.7782, lon: 75.0000, isHub: false },
  { name: 'GOA', lat: 15.2993, lon: 74.1240, isHub: false },
];

// Core National Hotspot Corridors across India
const NATIONAL_HOTSPOT_PRESETS = [
  { id: 'all', name: 'All India', lat: 22.8, lon: 79.2, zoom: 5 },
  { id: 'delhi', name: 'Delhi NCR', lat: 28.6139, lon: 77.2090, zoom: 10, count: 6, state: 'Delhi' },
  { id: 'mumbai', name: 'Mumbai Corridor', lat: 19.0760, lon: 72.8777, zoom: 10, count: 8, state: 'Maharashtra' },
  { id: 'ahmedabad', name: 'Ahmedabad & Surat', lat: 23.0225, lon: 72.5714, zoom: 9, count: 4, state: 'Gujarat' },
  { id: 'bengaluru', name: 'Bengaluru Cyber Hub', lat: 12.9716, lon: 77.5946, zoom: 10, count: 5, state: 'Karnataka' },
  { id: 'meerut', name: 'Meerut Logistics', lat: 28.9845, lon: 77.7064, zoom: 10, count: 3, state: 'Uttar Pradesh' },
  { id: 'kolkata', name: 'Kolkata Salt Lake', lat: 22.5726, lon: 88.3639, zoom: 10, count: 3, state: 'West Bengal' },
  { id: 'hyderabad', name: 'Hyderabad Cyberabad', lat: 17.3850, lon: 78.4867, zoom: 10, count: 3, state: 'Telangana' },
  { id: 'jaipur', name: 'Jaipur Syndicate Route', lat: 26.9124, lon: 75.7873, zoom: 10, count: 2, state: 'Rajasthan' },
  { id: 'punjab', name: 'Punjab Border Transit', lat: 31.6340, lon: 74.8723, zoom: 9, count: 3, state: 'Punjab' },
];

function normalise(value) {
  return (value || '').trim().toLowerCase().replace(/[^a-z0-9]/g, '');
}

// Function to generate tactical glowing state name label icon
function createStateLabelIcon(name, isHub) {
  return L.divIcon({
    className: 'state-tactical-label',
    html: `<div style="
      color: ${isHub ? '#d9aa3d' : '#8a948c'};
      font-size: ${isHub ? '11px' : '9px'};
      font-weight: 800;
      letter-spacing: 0.14em;
      text-transform: uppercase;
      font-family: 'Space Grotesk', monospace, sans-serif;
      white-space: nowrap;
      text-shadow: 0 1px 4px #000, 0 0 10px rgba(0,0,0,0.95);
      pointer-events: none;
      transform: translate(-50%, -50%);
      opacity: ${isHub ? '0.95' : '0.65'};
    ">${name}</div>`,
    iconSize: [0, 0],
    iconAnchor: [0, 0],
  });
}

// Smooth Heatmap Layer using Leaflet.heat with mode-specific gradient
function SmoothHeatmapLayer({ points, heatMode }) {
  const map = useMap();

  useEffect(() => {
    if (!points || !points.length) return;
    const maximum = Math.max(...points.map((point) => point.case_count || 1), 1);
    
    const heatData = points.map((point) => [
      point.lat,
      point.lon,
      Math.min(1.0, Math.max(0.35, ((point.case_count || 1) / maximum) * 1.2))
    ]);

    // Mode-specific gradients
    let gradient = {
      0.15: '#3b6641',
      0.35: '#5e9f68',
      0.55: '#d9aa3d',
      0.75: '#d97706',
      0.90: '#dc2626',
      1.0: '#991b1b',
    };

    if (heatMode === 'increasing') {
      gradient = {
        0.2: '#8a6515',
        0.45: '#d9aa3d',
        0.75: '#e85d04',
        1.0: '#d62828',
      };
    } else if (heatMode === 'decreasing') {
      gradient = {
        0.2: '#1b3b22',
        0.5: '#3b6641',
        0.8: '#5e9f68',
        1.0: '#72bf7e',
      };
    } else if (heatMode === 'repeated') {
      gradient = {
        0.2: '#8c6717',
        0.5: '#d9aa3d',
        0.8: '#f59e0b',
        1.0: '#d97706',
      };
    }

    const layer = L.heatLayer(heatData, {
      radius: 38,
      blur: 28,
      minOpacity: 0.45,
      maxZoom: 10,
      gradient,
    }).addTo(map);

    return () => {
      layer.remove();
    };
  }, [map, points, heatMode]);

  return null;
}

// Map Controller for Smooth Navigation & Centering
function MapController({ activeFocus }) {
  const map = useMap();

  useEffect(() => {
    map.fitBounds(INDIA_BOUNDS, { padding: [15, 15] });
  }, [map]);

  useEffect(() => {
    if (!activeFocus) return;
    if (activeFocus.id === 'all') {
      map.flyToBounds(INDIA_BOUNDS, { padding: [15, 15], duration: 1.2 });
    } else {
      map.flyTo([activeFocus.lat, activeFocus.lon], activeFocus.zoom || 9, {
        duration: 1.2,
        easeLinearity: 0.25
      });
    }
  }, [map, activeFocus]);

  return null;
}

export default function CrimeMap({ heatmap, heatMode = 'density', geographicMode = 'heatmap', selectedRegion, onSelectRegion }) {
  const mapRef = useRef(null);
  const [states, setStates] = useState(null);
  const [activePreset, setActivePreset] = useState('all');
  const [showStateLabels, setShowStateLabels] = useState(true);
  const [mapError, setMapError] = useState('');

  // Live crime points directly from backend /api/v1/map/crime-summary
  const allPoints = useMemo(() => {
    return heatmap?.points || [];
  }, [heatmap]);

  // Filter points dynamically based on heatMode: density | increasing | decreasing | repeated
  const visiblePoints = useMemo(() => {
    if (heatMode === 'increasing') {
      return allPoints.filter(p => p.trend === 'increasing' || (p.change_pct && p.change_pct > 0));
    }
    if (heatMode === 'decreasing') {
      return allPoints.filter(p => p.trend === 'decreasing' || (p.change_pct && p.change_pct < 0));
    }
    if (heatMode === 'repeated') {
      return allPoints.filter(p => p.is_repeated || p.trend === 'repeated' || (p.cases && p.cases.length >= 2) || (p.case_count && p.case_count >= 3));
    }
    return allPoints; // 'density' shows all points
  }, [allPoints, heatMode]);

  const regions = useMemo(() => heatmap?.regions ?? [], [heatmap]);

  useEffect(() => {
    let active = true;
    fetch('/geo/india-states.geojson')
      .then((response) => {
        if (!response.ok) throw new Error('State boundary data is unavailable');
        return response.json();
      })
      .then((data) => active && setStates(data))
      .catch((error) => active && setMapError(error.message));
    return () => {
      active = false;
    };
  }, []);

  const regionByState = useMemo(
    () => new Map(regions.map((region) => [normalise(region.name), region])),
    [regions]
  );

  const handleSelectPreset = (preset) => {
    setActivePreset(preset.id);
    if (mapRef.current) {
      if (preset.id === 'all') {
        mapRef.current.flyToBounds(INDIA_BOUNDS, { padding: [15, 15], duration: 1.2 });
      } else {
        mapRef.current.flyTo([preset.lat, preset.lon], preset.zoom, { duration: 1.2 });
        if (onSelectRegion && preset.state) {
          onSelectRegion(preset.state);
        }
      }
    }
  };

  const geoStyle = (feature) => {
    const stateName = feature?.properties?.NAME_1 || '';
    const region = regionByState.get(normalise(stateName));
    const selected = Boolean(region && selectedRegion === region.id);
    const hasCases = Boolean(region && region.case_count > 0);

    let stateFillColor = '#0e1410';
    let stateFillOpacity = 0.12;

    if (heatMode === 'increasing' && hasCases) {
      stateFillColor = '#d62828';
      stateFillOpacity = 0.35;
    } else if (heatMode === 'decreasing' && hasCases) {
      stateFillColor = '#5e9f68';
      stateFillOpacity = 0.35;
    } else if (heatMode === 'repeated' && hasCases) {
      stateFillColor = '#d9aa3d';
      stateFillOpacity = 0.38;
    } else if (hasCases) {
      stateFillColor = '#d9aa3d';
      stateFillOpacity = 0.30;
    }

    return {
      color: selected ? '#f1ebdd' : 'rgba(217, 170, 61, 0.45)',
      weight: selected ? 2.2 : 1.0,
      fillColor: stateFillColor,
      fillOpacity: stateFillOpacity,
      dashArray: hasCases ? '' : '3, 4',
    };
  };

  const getModeDescription = () => {
    if (heatMode === 'increasing') return 'Surging Corridors • High-Velocity Activity Clusters';
    if (heatMode === 'decreasing') return 'Cooling Corridors • Enforcement Suppression Zones';
    if (heatMode === 'repeated') return 'Chronic Recidivism Corridors • Multi-Case Criminal Hubs';
    return 'Overall Crime Density • Aggregated Incident Intensity';
  };

  return (
    <div className="space-y-3">
      {/* Tactical Quick-Jump Corridor Toolbar */}
      <div className="flex items-center justify-between gap-2 overflow-x-auto pb-1 scrollbar-thin">
        <div className="flex items-center gap-1.5 shrink-0">
          <div className="flex items-center gap-1.5 px-2 text-[11px] font-bold text-[#d9aa3d] uppercase tracking-wider shrink-0">
            <Compass size={13} />
            <span>Corridors:</span>
          </div>
          {NATIONAL_HOTSPOT_PRESETS.map((preset) => {
            const isActive = activePreset === preset.id;
            return (
              <button
                key={preset.id}
                type="button"
                onClick={() => handleSelectPreset(preset)}
                className={clsx(
                  "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold transition cursor-pointer whitespace-nowrap",
                  isActive
                    ? "border border-[#d9aa3d] bg-[rgba(217,170,61,0.22)] text-[#d9aa3d] shadow-sm"
                    : "border border-white/10 bg-[#101311] text-[#8a948c] hover:border-[#d9aa3d]/40 hover:text-[#f1ebdd]"
                )}
              >
                {preset.id === 'all' ? <RotateCcw size={11} /> : <MapPin size={11} className={isActive ? "text-[#d9aa3d]" : "text-[#8a948c]"} />}
                <span>{preset.name}</span>
                {preset.count && (
                  <span className="rounded bg-black/40 px-1.5 py-0.2 text-[9px] font-mono text-[#d9aa3d]">
                    {preset.count}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* State Label Toggle */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setShowStateLabels(!showStateLabels)}
            className={clsx(
              "flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-semibold border transition cursor-pointer whitespace-nowrap",
              showStateLabels
                ? "border-[#d9aa3d]/50 bg-[rgba(217,170,61,0.15)] text-[#d9aa3d]"
                : "border-white/10 bg-[#101311] text-[#8a948c] hover:text-[#f1ebdd]"
            )}
          >
            <span>State Labels</span>
          </button>
        </div>
      </div>

      {/* Main Map Container */}
      <div className="relative h-[560px] w-full overflow-hidden rounded-xl border border-[rgba(217,170,61,0.25)] bg-[#070a08] shadow-2xl">
        <MapContainer
          ref={mapRef}
          center={INDIA_CENTER}
          zoom={5}
          bounds={INDIA_BOUNDS}
          boundsOptions={{ padding: [15, 15] }}
          maxBounds={INDIA_MAX_BOUNDS}
          maxBoundsViscosity={1.0}
          minZoom={4.5}
          maxZoom={14}
          className="analyst-leaflet-map h-full w-full"
          zoomControl={true}
        >
          {/* Free, 100% Watermark-Free Dark Basemap (Esri World Dark Canvas) */}
          <TileLayer
            attribution='&copy; <a href="https://www.esri.com/">Esri</a> &copy; OpenStreetMap'
            url="https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}"
            maxZoom={16}
          />

          <MapController activeFocus={NATIONAL_HOTSPOT_PRESETS.find(p => p.id === activePreset)} />

          {/* India States GeoJSON Boundaries */}
          {states && (
            <GeoJSON
              key={`${heatMode}-${geographicMode}-${selectedRegion || 'none'}-${regions.length}`}
              data={states}
              style={geoStyle}
              onEachFeature={(feature, layer) => {
                const stateName = feature.properties?.NAME_1 || 'Unknown region';
                const region = regionByState.get(normalise(stateName));
                layer.bindTooltip(
                  region ? `${stateName} • ${region.case_count} Case${region.case_count === 1 ? '' : 's'} Logged` : stateName,
                  { sticky: true, className: 'tactical-map-tooltip' }
                );
                if (region?.visible && onSelectRegion) {
                  layer.on('click', () => onSelectRegion(region.id));
                }
              }}
            />
          )}

          {/* Render State Name Labels directly on the Map */}
          {showStateLabels &&
            INDIAN_STATE_LABELS.map((st) => (
              <Marker
                key={st.name}
                position={[st.lat, st.lon]}
                icon={createStateLabelIcon(st.name, st.isHub)}
                interactive={false}
              />
            ))}

          {/* Smooth High-Density Heatmap Radar */}
          <SmoothHeatmapLayer points={visiblePoints} heatMode={heatMode} />

          {/* Glowing Hotspot Nodes & Interactive Popups */}
          {visiblePoints.map((point) => {
            const count = point.case_count || 1;
            const isIncreasing = point.trend === 'increasing' || (point.change_pct && point.change_pct > 0);
            const isDecreasing = point.trend === 'decreasing' || (point.change_pct && point.change_pct < 0);
            const isRepeated = point.is_repeated || point.trend === 'repeated';

            // Pin color by mode and trend
            let pinColor = '#d9aa3d';
            let haloColor = '#d9aa3d';

            if (heatMode === 'increasing' || isIncreasing) {
              pinColor = '#d62828';
              haloColor = '#d62828';
            } else if (heatMode === 'decreasing' || isDecreasing) {
              pinColor = '#5e9f68';
              haloColor = '#5e9f68';
            } else if (heatMode === 'repeated' || isRepeated) {
              pinColor = '#f59e0b';
              haloColor = '#f59e0b';
            }

            return (
              <React.Fragment key={point.id}>
                {/* Outer radar pulse halo */}
                <CircleMarker
                  center={[point.lat, point.lon]}
                  radius={isIncreasing ? 16 : isRepeated ? 14 : 11}
                  pathOptions={{
                    color: haloColor,
                    weight: 1,
                    fillColor: haloColor,
                    fillOpacity: 0.18,
                    className: 'animate-ping'
                  }}
                />

                {/* Core Hotspot Marker */}
                <CircleMarker
                  center={[point.lat, point.lon]}
                  radius={isIncreasing ? 7 : 5.5}
                  pathOptions={{
                    color: '#f1ebdd',
                    weight: 1.5,
                    fillColor: pinColor,
                    fillOpacity: 0.95,
                  }}
                  eventHandlers={{
                    click: () => onSelectRegion && onSelectRegion(normalise(point.city || point.state))
                  }}
                >
                  <Popup className="tactical-dark-popup">
                    <div className="min-w-64 p-2 text-xs font-sans text-[#f1ebdd] bg-[#101311] rounded-lg">
                      <div className="flex items-center justify-between border-b border-[rgba(217,170,61,0.25)] pb-1.5 mb-2">
                        <span className="font-bold text-[#d9aa3d] text-[13px] flex items-center gap-1.5">
                          <MapPin size={13} className="text-[#d62828]" /> {point.name}
                        </span>
                        <span
                          className={clsx(
                            "px-1.5 py-0.5 rounded text-[9px] font-mono font-bold border",
                            isIncreasing ? "bg-[rgba(214,40,40,0.2)] text-[#fca5a5] border-[rgba(214,40,40,0.4)]" :
                            isDecreasing ? "bg-[rgba(94,159,104,0.2)] text-[#72bf7e] border-[rgba(94,159,104,0.4)]" :
                            "bg-[rgba(217,170,61,0.2)] text-[#d9aa3d] border-[rgba(217,170,61,0.4)]"
                          )}
                        >
                          {count} INCIDENTS
                        </span>
                      </div>

                      <div className="space-y-1.5 text-[11px]">
                        <p className="text-[#8a948c]">
                          Jurisdiction: <span className="text-[#f1ebdd] font-semibold">{point.state}</span>
                        </p>
                        {point.type && (
                          <p className="text-[#8a948c]">
                            Threat Pattern: <span className="text-[#e8d9a8] font-semibold">{point.type}</span>
                          </p>
                        )}
                        {point.change_pct !== undefined && (
                          <p className="text-[#8a948c] flex items-center gap-1">
                            Velocity Delta:
                            {point.change_pct > 0 ? (
                              <span className="text-[#fca5a5] font-bold flex items-center">
                                <TrendingUp size={11} className="mr-0.5" /> +{point.change_pct}% Surge
                              </span>
                            ) : point.change_pct < 0 ? (
                              <span className="text-[#72bf7e] font-bold flex items-center">
                                <TrendingDown size={11} className="mr-0.5" /> {point.change_pct}% Suppressed
                              </span>
                            ) : (
                              <span className="text-[#d9aa3d] font-bold">Stable Recidivism</span>
                            )}
                          </p>
                        )}
                      </div>

                      {point.cases && point.cases.length > 0 && (
                        <div className="mt-2.5 pt-2 border-t border-white/10 space-y-1.5">
                          <p className="text-[10px] font-bold text-[#8a948c] uppercase tracking-wider">Associated Cases:</p>
                          {point.cases.map((incident) => (
                            <div key={incident.case_number} className="bg-black/40 rounded p-1.5 border border-white/5 text-[10px]">
                              <div className="flex justify-between font-mono font-bold text-[#d9aa3d]">
                                <span>{incident.case_number}</span>
                                <span className="text-[#8a948c]">{incident.incident_date}</span>
                              </div>
                              <p className="text-[#f1ebdd] mt-0.5">{incident.crime_category}</p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* Top-Left Telemetry HUD Badge */}
        <div className="pointer-events-none absolute left-3 top-3 z-[1000] flex items-center gap-2 rounded-lg border border-[rgba(217,170,61,0.3)] bg-[#101311]/95 px-3 py-1.5 shadow-xl backdrop-blur-md">
          <Radio size={13} className="text-[#d9aa3d] animate-pulse" />
          <div className="text-[10px]">
            <p className="font-bold text-[#d9aa3d] tracking-widest uppercase font-mono">INDIA CRIME RADAR</p>
            <p className="text-[#8a948c] text-[9px]">{visiblePoints.length} Active Corridors • {getModeDescription()}</p>
          </div>
        </div>

        {/* Top-Right Reset & Controls */}
        <div className="absolute right-3 top-3 z-[1000] flex items-center gap-2">
          <button
            type="button"
            onClick={() => handleSelectPreset(NATIONAL_HOTSPOT_PRESETS[0])}
            className="flex items-center gap-1.5 rounded-lg border border-[rgba(217,170,61,0.4)] bg-[#101311]/95 px-2.5 py-1.5 text-xs font-semibold text-[#d9aa3d] shadow-xl hover:bg-[rgba(217,170,61,0.2)] transition cursor-pointer backdrop-blur-md"
          >
            <RotateCcw size={12} /> Fit India Bounds
          </button>
        </div>

        {/* Bottom Heat Intensity Legend */}
        <div className="pointer-events-none absolute bottom-4 right-4 z-[1000] rounded-lg border border-white/10 bg-[#101311]/95 p-2.5 shadow-xl backdrop-blur-md">
          <div className="flex items-center justify-between text-[9px] font-bold text-[#8a948c] uppercase mb-1">
            <span>Low {heatMode.toUpperCase()}</span>
            <span className={heatMode === 'decreasing' ? "text-[#72bf7e]" : "text-[#d62828]"}>
              High {heatMode.toUpperCase()}
            </span>
          </div>
          <div
            className={clsx(
              "h-2 w-44 rounded-full border border-white/10",
              heatMode === 'decreasing' ? "bg-gradient-to-r from-[#1b3b22] via-[#3b6641] to-[#72bf7e]" :
              heatMode === 'repeated' ? "bg-gradient-to-r from-[#553c00] via-[#d9aa3d] to-[#f59e0b]" :
              "bg-gradient-to-r from-[#3b6641] via-[#d9aa3d] via-[#d97706] to-[#d62828]"
            )}
          ></div>
        </div>

        {mapError && <p className="absolute bottom-3 left-3 z-[1000] text-xs text-[#d62828] bg-black/80 px-2 py-1 rounded">{mapError}</p>}
      </div>
    </div>
  );
}
