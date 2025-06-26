"use client";

import React, { useEffect, useRef, useState } from "react";
import { RankingData } from "@/types";
import { ErrorBoundary, MapErrorFallback } from "./ErrorBoundary";
import { MapSkeleton, LoadingSpinner } from "./LoadingSkeletons";

interface RankingMapProps {
  data: RankingData;
}

const RankingMapComponent: React.FC<RankingMapProps> = ({ data }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const [mapError, setMapError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [leafletLoaded, setLeafletLoaded] = useState(false);

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

  // Initialize map when Leaflet is loaded and data is available
  useEffect(() => {
    if (!leafletLoaded || !data || !mapRef.current) return;

    const initializeMap = () => {
      try {
        setIsInitializing(true);
        setMapError(null);

        // Clean up existing map
        if (mapInstanceRef.current) {
          mapInstanceRef.current.remove();
          mapInstanceRef.current = null;
          markersRef.current = [];
        }

        const L = (window as any).L;

        // Create map
        mapInstanceRef.current = L.map(mapRef.current).setView(
          [data.center.lat, data.center.lng],
          11
        );

        // Add OpenStreetMap tiles
        L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
          attribution: "© OpenStreetMap contributors",
          maxZoom: 19,
        }).addTo(mapInstanceRef.current);

        // Filter businesses with valid coordinates
        const businessesWithCoords = data.businesses.filter(
          (b) => b.lat && b.lng && !isNaN(b.lat) && !isNaN(b.lng)
        );

        if (businessesWithCoords.length === 0) {
          setMapError("No businesses with valid coordinates to display");
          setIsInitializing(false);
          return;
        }

        // Create custom icon function
        const createCustomIcon = (business: any) => {
          const color = business.isTarget
            ? "#3b82f6" // Blue for target business
            : business.rank > 10
            ? "#dc2626" // Red for low ranks
            : business.rank > 3
            ? "#f59e0b" // Orange for medium ranks
            : "#10b981"; // Green for top ranks

          const size = business.isTarget ? 30 : business.rank > 10 ? 25 : 20;

          return L.divIcon({
            html: `
              <div style="
                background-color: ${color};
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                border: ${business.isTarget ? "3px" : "2px"} solid white;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 12px;
                color: white;
                box-shadow: 0 2px 4px rgba(0,0,0,0.3);
              ">
                ${business.rank > 20 ? "20+" : business.rank}
              </div>
            `,
            className: "custom-marker",
            iconSize: [size, size],
            iconAnchor: [size / 2, size / 2],
          });
        };

        // Add markers for each business
        businessesWithCoords.forEach((business) => {
          const marker = L.marker([business.lat, business.lng], {
            icon: createCustomIcon(business),
          }).addTo(mapInstanceRef.current);

          // Create popup content
          const popupContent = `
            <div style="min-width: 200px; max-width: 250px;">
              <h3 style="margin: 0 0 8px 0; font-weight: bold; color: ${
                business.isTarget ? "#3b82f6" : "#374151"
              };">${business.name}</h3>
              <div style="font-size: 12px; color: #6b7280; line-height: 1.4;">
                <p style="margin: 2px 0;"><strong>Rank:</strong> #${
                  business.rank
                }</p>
                <p style="margin: 2px 0;"><strong>Visibility:</strong> ${
                  business.visibility
                }%</p>
                <p style="margin: 2px 0;"><strong>Difficulty:</strong> ${
                  business.difficulty
                }</p>
                ${
                  business.rating
                    ? `<p style="margin: 2px 0;"><strong>Rating:</strong> ${
                        business.rating
                      } ⭐ (${business.reviews || 0} reviews)</p>`
                    : ""
                }
                ${
                  business.isTarget
                    ? '<p style="margin: 4px 0 2px 0; color: #3b82f6; font-weight: bold;">🎯 Your Business</p>'
                    : ""
                }
                <p style="margin: 4px 0 0 0; font-size: 11px; color: #9ca3af;">${
                  business.address
                }</p>
              </div>
            </div>
          `;

          marker.bindPopup(popupContent);
          markersRef.current.push(marker);

          // Add visibility circle for top 10 businesses
          if (business.rank <= 10) {
            const color = business.isTarget
              ? "#3b82f6"
              : business.rank > 10
              ? "#dc2626"
              : business.rank > 3
              ? "#f59e0b"
              : "#10b981";

            L.circle([business.lat, business.lng], {
              color: color,
              fillColor: color,
              fillOpacity: 0.08,
              weight: 1,
              opacity: 0.2,
              radius: business.rank > 5 ? 1500 : 2500,
            }).addTo(mapInstanceRef.current);
          }
        });

        // Fit map to show all markers
        if (markersRef.current.length > 0) {
          const group = L.featureGroup(markersRef.current);
          mapInstanceRef.current.fitBounds(group.getBounds(), {
            padding: [20, 20],
          });

          // Ensure minimum zoom level
          if (mapInstanceRef.current.getZoom() > 15) {
            mapInstanceRef.current.setZoom(15);
          }
        }

        setIsInitializing(false);
        console.log("OpenStreetMap initialized successfully");
      } catch (error) {
        console.error("Map initialization error:", error);
        setMapError(
          error instanceof Error ? error.message : "Failed to initialize map"
        );
        setIsInitializing(false);
      }
    };

    initializeMap();

    // Cleanup on unmount
    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
        markersRef.current = [];
      }
    };
  }, [leafletLoaded, data]);

  const handleZoomIn = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.zoomOut();
    }
  };

  const handleRecenter = () => {
    if (mapInstanceRef.current && data) {
      if (markersRef.current.length > 0) {
        const L = (window as any).L;
        const group = L.featureGroup(markersRef.current);
        mapInstanceRef.current.fitBounds(group.getBounds(), {
          padding: [20, 20],
        });
      } else {
        mapInstanceRef.current.setView([data.center.lat, data.center.lng], 11);
      }
    }
  };

  // Show loading skeleton while Leaflet is loading
  if (!leafletLoaded) {
    return <MapSkeleton />;
  }

  // Show map error state
  if (mapError) {
    return (
      <div className="w-full h-96 bg-yellow-50 rounded-lg border border-yellow-200 flex items-center justify-center">
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

  // Validate data before rendering map
  if (!data || !data.center) {
    return (
      <div className="w-full h-96 bg-gray-100 rounded-lg border border-gray-200 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-gray-500"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
              />
            </svg>
          </div>
          <h3 className="text-sm font-medium text-gray-900 mb-2">
            No Map Data
          </h3>
          <p className="text-xs text-gray-600">
            No location data available to display on the map.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      {/* Map Container */}
      <div
        ref={mapRef}
        className="w-full h-96 rounded-lg border border-gray-200"
      />

      {/* Loading Overlay */}
      {isInitializing && (
        <div className="absolute inset-0 bg-white bg-opacity-75 rounded-lg flex items-center justify-center">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="mt-2 text-sm text-gray-600">Initializing map...</p>
          </div>
        </div>
      )}

      {/* Custom Controls */}
      <div className="absolute top-4 right-4 flex flex-col space-y-2 z-[1000]">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Zoom in"
          title="Zoom in"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 4v16m8-8H4"
            />
          </svg>
        </button>

        <button
          onClick={handleZoomOut}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Zoom out"
          title="Zoom out"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 12H4"
            />
          </svg>
        </button>

        <button
          onClick={handleRecenter}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition-colors"
          aria-label="Recenter map"
          title="Recenter map"
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-5 w-5 text-gray-800"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 max-w-48 z-[1000]">
        <h4 className="text-xs font-semibold text-gray-900 mb-2">Map Legend</h4>
        <div className="space-y-1 text-xs">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-blue-500 rounded-full"></div>
            <span className="text-gray-700">Your Business</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded-full"></div>
            <span className="text-gray-700">Top 3 (Easy)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded-full"></div>
            <span className="text-gray-700">4-10 (Medium)</span>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded-full"></div>
            <span className="text-gray-700">10+ (Hard)</span>
          </div>
        </div>
      </div>

      {/* Business Count */}
      {data.businesses.length > 0 && (
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2 z-[1000]">
          <p className="text-sm font-medium text-gray-900">
            {data.businesses.filter((b) => b.lat && b.lng).length} businesses
            shown
          </p>
          <p className="text-xs text-gray-600">Click markers for details</p>
        </div>
      )}
    </div>
  );
};

// Wrap with error boundary
const RankingMap: React.FC<RankingMapProps> = (props) => (
  <ErrorBoundary fallback={MapErrorFallback}>
    <RankingMapComponent {...props} />
  </ErrorBoundary>
);

export default RankingMap;
