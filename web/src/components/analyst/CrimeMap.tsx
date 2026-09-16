"use client";
/* eslint-disable @typescript-eslint/no-explicit-any */

import { useEffect, useMemo, useRef, useState } from "react";
import L, { type Map as LeafletMap } from "leaflet";
import "leaflet.heat";
import { CircleMarker, GeoJSON, MapContainer, Popup, TileLayer, useMap } from "react-leaflet";

type GeographicMode = "heatmap" | "region_density";

type CrimePoint = {
  id: string;
  name: string;
  state: string;
  city: string;
  lat: number;
  lon: number;
  case_count: number;
  cases: Array<{
    case_number: string;
    title: string;
    crime_category: string;
    incident_date: string;
    status: string;
  }>;
};

const INDIA_BOUNDS: L.LatLngBoundsExpression = [
  [6.2, 68.0],
  [37.7, 98.8],
];

const DENSITY_COLORS = ["#36403b", "#7a8f52", "#d9aa3d", "#e85d04", "#d62828"];

function normalise(value: string) {
  return (value || "").trim().toLowerCase().replace(/[^a-z0-9]/g, "");
}

function colorForRegion(region: any) {
  if (!region?.case_count) return DENSITY_COLORS[0];
  const intensity = region.density?.intensity ?? 0;
  if (region.display_band === "INCREASING") return "#d62828";
  if (region.display_band === "DECREASING") return "#5e9f68";
  if (intensity >= 0.75) return DENSITY_COLORS[4];
  if (intensity >= 0.5) return DENSITY_COLORS[3];
  if (intensity >= 0.25) return DENSITY_COLORS[2];
  return DENSITY_COLORS[1];
}

function RecordedHeatLayer({ points }: { points: CrimePoint[] }) {
  const map = useMap();

  useEffect(() => {
    if (!points.length) return;
    const maximum = Math.max(...points.map((point) => point.case_count), 1);
    const layer = L.heatLayer(
      points.map((point) => [point.lat, point.lon, Math.max(0.2, point.case_count / maximum)] as L.HeatLatLngTuple),
      {
        radius: 32,
        blur: 24,
        minOpacity: 0.35,
        maxZoom: 9,
        gradient: { 0.2: "#f0d878", 0.45: "#d9aa3d", 0.7: "#e85d04", 1: "#d62828" },
      },
    ).addTo(map);
    return () => {
      layer.remove();
    };
  }, [map, points]);

  return null;
}

function MapViewport() {
  const map = useMap();
  useEffect(() => {
    map.fitBounds(INDIA_BOUNDS, { padding: [14, 14] });
  }, [map]);
  return null;
}

export default function CrimeMap({
  heatmap,
  geographicMode,
  selectedRegion,
  onSelectRegion,
}: {
  heatmap: any;
  geographicMode: GeographicMode;
  selectedRegion: string | null;
  onSelectRegion: (regionId: string) => void;
}) {
  const mapRef = useRef<LeafletMap | null>(null);
  const [states, setStates] = useState<any>(null);
  const [mapError, setMapError] = useState("");
  const regions = useMemo(() => heatmap?.regions ?? [], [heatmap]);
  const points = useMemo<CrimePoint[]>(() => heatmap?.points ?? [], [heatmap]);

  useEffect(() => {
    let active = true;
    fetch("/geo/india-states.geojson")
      .then((response) => {
        if (!response.ok) throw new Error("State boundary data is unavailable");
        return response.json();
      })
      .then((data) => active && setStates(data))
      .catch((error: Error) => active && setMapError(error.message));
    return () => {
      active = false;
    };
  }, []);

  const regionByState = useMemo(
    () => new Map<string, any>(regions.map((region: any) => [normalise(region.name), region])),
    [regions],
  );
  const visibleStates = useMemo(
    () => new Set(regions.filter((region: any) => region.visible).map((region: any) => normalise(region.state))),
    [regions],
  );
  const visiblePoints = useMemo(
    () => points.filter((point) => visibleStates.has(normalise(point.state))),
    [points, visibleStates],
  );

  const resetToIndia = () => mapRef.current?.fitBounds(INDIA_BOUNDS, { padding: [14, 14] });
  const geoStyle = (feature?: any) => {
    const stateName = feature?.properties?.NAME_1 || "";
    const region = regionByState.get(normalise(stateName));
    const selected = Boolean(region && selectedRegion === region.id);
    return {
      color: selected ? "#f1ebdd" : "rgba(217, 170, 61, 0.45)",
      weight: selected ? 2.4 : 0.8,
      fillColor: colorForRegion(region),
      fillOpacity: region?.visible ? 0.72 : 0.16,
    };
  };

  return (
    <div className="relative h-[480px] overflow-hidden rounded-lg border border-[var(--line)] bg-[#0b100d]">
      <MapContainer
        ref={mapRef}
        bounds={INDIA_BOUNDS}
        boundsOptions={{ padding: [14, 14] }}
        maxBounds={[[1, 60], [43, 106]]}
        maxBoundsViscosity={0.7}
        minZoom={4}
        className="analyst-leaflet-map h-full w-full"
        zoomControl
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <MapViewport />
        {states && (
          <GeoJSON
            key={`${geographicMode}-${selectedRegion || "none"}-${regions.length}`}
            data={states}
            style={geoStyle}
            onEachFeature={(feature, layer) => {
              const stateName = feature.properties?.NAME_1 || "Unknown region";
              const region = regionByState.get(normalise(stateName));
              layer.bindTooltip(
                region ? `${stateName}: ${region.case_count} case${region.case_count === 1 ? "" : "s"}` : stateName,
                { sticky: true },
              );
              if (region?.visible) layer.on("click", () => onSelectRegion(region.id));
            }}
          />
        )}
        {geographicMode === "heatmap" && <RecordedHeatLayer points={visiblePoints} />}
        {geographicMode === "heatmap" &&
          visiblePoints.map((point) => (
            <CircleMarker
              key={point.id}
              center={[point.lat, point.lon]}
              radius={5}
              pathOptions={{ color: "#f1ebdd", weight: 1, fillColor: "#e85d04", fillOpacity: 0.78 }}
              eventHandlers={{ click: () => onSelectRegion(normalise(point.city || point.state)) }}
            >
              <Popup>
                <div className="min-w-52 text-sm text-slate-900">
                  <strong>{point.name}</strong>
                  <p className="mb-2 mt-1 text-xs text-slate-600">
                    Recorded coordinates · {point.case_count} linked incident{point.case_count === 1 ? "" : "s"}
                  </p>
                  {point.cases.map((incident) => (
                    <div key={incident.case_number} className="mb-2 border-t border-slate-200 pt-2 text-xs">
                      <strong>CASE-{incident.case_number}</strong> · {incident.crime_category}
                      <br />
                      {new Date(incident.incident_date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "short",
                        year: "numeric",
                      })}
                    </div>
                  ))}
                </div>
              </Popup>
            </CircleMarker>
          ))}
      </MapContainer>

      <button
        type="button"
        onClick={resetToIndia}
        className="absolute right-3 top-3 z-[1000] rounded-md border border-gold/70 bg-[#101311]/95 px-2.5 py-1.5 text-xs font-semibold text-gold shadow-lg"
      >
        Reset to India
      </button>
      <div className="pointer-events-none absolute bottom-5 left-3 z-[1000] max-w-xs rounded-md border border-white/10 bg-[#101311]/95 px-3 py-2 text-[11px] text-parchment shadow-lg">
        {geographicMode === "heatmap" ? (
          <>
            <span className="text-gold">Recorded coordinate heatmap</span> · {visiblePoints.length} source locations
          </>
        ) : (
          <>
            <span className="text-gold">State density</span> · shading reflects filtered case counts
          </>
        )}
      </div>
      {mapError && <p className="absolute bottom-3 right-3 z-[1000] text-xs text-signal">{mapError}</p>}
    </div>
  );
}
