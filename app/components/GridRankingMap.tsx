"use client";

import React, { useEffect, useRef, useState } from "react";
import { RankingData } from "@/types";
import { ErrorBoundary, MapErrorFallback } from "./ErrorBoundary";
import { MapSkeleton, LoadingSpinner } from "./LoadingSkeletons";
import {
  GeoGridGenerator,
  GeoGridSystem,
  GeoGridUtils,
} from "@/lib/geoGridSystem";

interface GridRankingMapProps {
  data: RankingData;
  selectedKeyword: string;
}

const GridRankingMapComponent: React.FC<GridRankingMapProps> = ({
  data,
  selectedKeyword,
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const gridOverlaysRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);
  const [geoGrid, setGeoGrid] = useState<GeoGridSystem | null>(null);

  // Load Leaflet dynamically
  useEffect(() => {
    const loadLeaflet = async () => {
      try {
        // Load Leaflet CSS
        if (!document.querySelector('link[href*="leaflet.css"]')) {
          const link = document.createElement("link");
          link.rel = "stylesheet";
          link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
          document.head.appendChild(link);
        }

        // Load Leaflet JS
        if (!(window as any).L) {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => setLeafletLoaded(true);
          document.head.appendChild(script);
        } else {
          setLeafletLoaded(true);
        }
      } catch (error) {
        console.error("Failed to load Leaflet:", error);
        setMapError("Failed to load map library");
      }
    };

    loadLeaflet();
  }, []);

  // Generate geo-grid when data is available
  useEffect(() => {
    if (data && data.center) {
      // Use a dense grid for the ranking visualization
      const config = GeoGridGenerator.getDenseConfig(
        data.center.lat,
        data.center.lng
      );
      const grid = GeoGridGenerator.generate(config);
      setGeoGrid(grid);
      console.log("Generated geo-grid with", grid.totalPoints, "points");
    }
  }, [data]);

  // Initialize map when Leaflet is loaded and data is available
  useEffect(() => {
    if (!leafletLoaded || !data || !mapRef.current || !geoGrid) return;

    const initializeMap = () => {
      try {
        setIsInitializing(true);
        setMapError(null);

        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          gridOverlaysRef.current = [];
        }

        const L = (window as any).L;

        // Create map with custom options
        mapInstanceRef.current = L.map(mapRef.current, {
          zoomControl: false,
          attributionControl: false,
        }).setView([data.center.lat, data.center.lng], 13);

        // Add custom zoom controls
        L.control
          .zoom({
            position: "topright",
          })
          .addTo(mapInstanceRef.current);

        // Add OpenStreetMap tiles with light style
        L.tileLayer(
          "https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png",
          {
            maxZoom: 19,
            subdomains: "abcd",
          }
        ).addTo(mapInstanceRef.current);

        // Add the grid overlay
        addRankingGrid(L);

        setIsInitializing(false);
        console.log("Grid map initialized successfully");
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError(
          error instanceof Error ? error.message : "Failed to initialize map"
        );
        setIsInitializing(false);
      }
    };

    const addRankingGrid = (L: any) => {
      if (!geoGrid) return;

      // Clear existing overlays
      gridOverlaysRef.current.forEach((overlay) => {
        mapInstanceRef.current.removeLayer(overlay);
      });
      gridOverlaysRef.current = [];

      // Calculate ranking for each grid point
      const gridRankings = calculateGridRankings();

      // Add circles for each grid point
      geoGrid.allPoints.forEach((point) => {
        const ranking = gridRankings.get(point.id) || 999;
        const { color, size } = getRankingStyle(ranking);

        // Create circle marker
        const circle = L.circleMarker([point.lat, point.lng], {
          radius: size,
          fillColor: color,
          color: "#fff",
          weight: 2,
          opacity: 1,
          fillOpacity: 0.8,
        }).addTo(mapInstanceRef.current);

        // Add ranking number
        const icon = L.divIcon({
          html: `<div style="
            display: flex;
            align-items: center;
            justify-content: center;
            width: ${size * 2}px;
            height: ${size * 2}px;
            color: white;
            font-weight: bold;
            font-size: ${ranking > 20 ? "10px" : "12px"};
          ">${ranking > 20 ? "20+" : ranking}</div>`,
          className: "ranking-label",
          iconSize: [size * 2, size * 2],
          iconAnchor: [size, size],
        });

        const marker = L.marker([point.lat, point.lng], { icon }).addTo(
          mapInstanceRef.current
        );

        // Add popup
        const popupContent = `
          <div style="min-width: 150px;">
            <h4 style="margin: 0 0 8px 0; font-weight: bold;">
              Grid Point ${point.ringIndex}-${point.pointIndex + 1}
            </h4>
            <p style="margin: 4px 0; font-size: 12px;">
              <strong>Ranking:</strong> #${ranking}<br/>
              <strong>Distance:</strong> ${GeoGridUtils.formatDistance(
                point.distanceFromCenter
              )}<br/>
              <strong>Keyword:</strong> ${selectedKeyword}<br/>
              <strong>Visibility:</strong> ${getVisibilityForRank(
                ranking
              )}%<br/>
              <strong>Difficulty:</strong> ${getDifficultyForRank(ranking)}
            </p>
          </div>
        `;

        circle.bindPopup(popupContent);
        marker.bindPopup(popupContent);

        gridOverlaysRef.current.push(circle, marker);
      });

      // Fit bounds to show all grid points
      const bounds = L.latLngBounds(
        geoGrid.allPoints.map((p) => [p.lat, p.lng])
      );
      mapInstanceRef.current.fitBounds(bounds, { padding: [50, 50] });
    };

    const calculateGridRankings = (): Map<string, number> => {
      const rankings = new Map<string, number>();

      // Simulate ranking distribution across the grid
      // In a real implementation, this would come from actual search results
      geoGrid?.allPoints.forEach((point) => {
        // Calculate a simulated ranking based on distance from center
        // Closer points have better rankings
        const distanceFactor = point.distanceFromCenter / 3000; // Normalize to 0-1
        const randomFactor = Math.random() * 0.3; // Add some randomness

        let ranking;
        if (point.ringIndex === 0) {
          ranking = 1; // Center point
        } else if (distanceFactor < 0.3) {
          ranking = Math.floor(1 + distanceFactor * 10 + randomFactor * 5);
        } else if (distanceFactor < 0.6) {
          ranking = Math.floor(3 + distanceFactor * 15 + randomFactor * 7);
        } else {
          ranking = Math.floor(10 + distanceFactor * 20 + randomFactor * 10);
        }

        rankings.set(point.id, Math.min(ranking, 30));
      });

      return rankings;
    };

    const getRankingStyle = (
      ranking: number
    ): { color: string; size: number } => {
      if (ranking === 1) {
        return { color: "#10b981", size: 25 }; // Green, largest
      } else if (ranking <= 3) {
        return { color: "#22c55e", size: 22 }; // Light green
      } else if (ranking <= 5) {
        return { color: "#84cc16", size: 20 }; // Lime
      } else if (ranking <= 10) {
        return { color: "#facc15", size: 18 }; // Yellow
      } else if (ranking <= 15) {
        return { color: "#fb923c", size: 16 }; // Orange
      } else if (ranking <= 20) {
        return { color: "#f87171", size: 14 }; // Light red
      } else {
        return { color: "#dc2626", size: 12 }; // Dark red
      }
    };

    const getVisibilityForRank = (rank: number): number => {
      const baseVisibility = 100;
      const decayRate = 0.15;
      return Math.max(
        5,
        Math.min(100, Math.round(baseVisibility * Math.exp(-decayRate * rank)))
      );
    };

    const getDifficultyForRank = (rank: number): string => {
      if (rank <= 3) return "LOW";
      if (rank <= 10) return "MEDIUM";
      return "HIGH";
    };

    initializeMap();

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        gridOverlaysRef.current = [];
      }
    };
  }, [leafletLoaded, data, geoGrid, selectedKeyword]);

  // Show loading skeleton while Leaflet is loading
  if (!leafletLoaded || !geoGrid) {
    return (
      <div className="w-full h-[600px] flex items-center justify-center bg-gray-100 rounded-lg">
        <div className="text-center">
          <LoadingSpinner size="large" />
          <p className="mt-2 text-sm text-gray-600">Loading map...</p>
        </div>
      </div>
    );
  }

  // Show map error state
  if (mapError) {
    return (
      <div className="w-full h-[600px] bg-yellow-50 rounded-lg border border-yellow-200 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-yellow-600"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-yellow-900 mb-2">
            Map Display Issue
          </h3>
          <p className="text-xs text-yellow-700 mb-3">{mapError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-[600px] rounded-lg border border-gray-200"
      />

      {/* Loading Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="mt-2 text-sm text-gray-600">
              Initializing grid map...
            </p>
          </div>
        </div>
      )}

      {/* Timestamp */}
      <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md px-3 py-2 z-[1000]">
        <p className="text-sm text-gray-600">
          {new Date().toLocaleDateString("en-US", {
            month: "long",
            day: "numeric",
            year: "numeric",
          })}{" "}
          at{" "}
          {new Date().toLocaleTimeString("en-US", {
            hour: "numeric",
            minute: "2-digit",
            hour12: true,
          })}
        </p>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white rounded-lg shadow-md p-3 z-[1000]">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">
          Ranking Colors
        </h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">1-3 (Excellent)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-lime-500 rounded-full"></div>
            <span className="text-gray-700">4-5 (Very Good)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-400 rounded-full"></div>
            <span className="text-gray-700">6-10 (Good)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-orange-400 rounded-full"></div>
            <span className="text-gray-700">11-15 (Average)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-400 rounded-full"></div>
            <span className="text-gray-700">16-20 (Poor)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-600 rounded-full"></div>
            <span className="text-gray-700">20+ (Very Poor)</span>
          </div>
        </div>
      </div>

      {/* Map Attribution */}
      <div className="absolute bottom-4 left-4 bg-white rounded shadow-sm px-2 py-1 z-[1000]">
        <p className="text-xs text-gray-500">
          © Mapbox © OpenStreetMap{" "}
          <button
            className="text-blue-600 hover:underline ml-1"
            onClick={() =>
              window.open("https://www.mapbox.com/map-feedback/", "_blank")
            }
          >
            Improve this map
          </button>
        </p>
      </div>
    </div>
  );
};

// Wrap with error boundary
const GridRankingMap: React.FC<GridRankingMapProps> = (props) => (
  <ErrorBoundary fallback={MapErrorFallback}>
    <GridRankingMapComponent {...props} />
  </ErrorBoundary>
);

export default GridRankingMap;
