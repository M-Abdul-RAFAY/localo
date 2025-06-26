"use client";

import React, { useEffect, useRef, useState, useCallback } from "react";
import { RankingData } from "@/types";
import { useGoogleMaps } from "../hooks/useGoogleMaps";
import { ErrorBoundary, MapErrorFallback } from "./ErrorBoundary";
import { MapSkeleton, LoadingSpinner } from "./LoadingSkeletons";

interface RankingMapProps {
  data: RankingData;
}

const RankingMapComponent: React.FC<RankingMapProps> = ({ data }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const circlesRef = useRef<google.maps.Circle[]>([]);
  const infoWindowRef = useRef<google.maps.InfoWindow | null>(null);

  const [mapError, setMapError] = useState<string | null>(null);
  const [isInitializing, setIsInitializing] = useState(true);

  const { isLoaded: mapsLoaded, loadError, isLoading } = useGoogleMaps();

  // Clean up map resources
  const cleanupMap = useCallback(() => {
    // Clear existing markers
    markersRef.current.forEach((marker) => {
      marker.setMap(null);
    });
    markersRef.current = [];

    // Clear existing circles
    circlesRef.current.forEach((circle) => {
      circle.setMap(null);
    });
    circlesRef.current = [];

    // Close info window
    if (infoWindowRef.current) {
      infoWindowRef.current.close();
    }
  }, []);

  // Initialize or update map
  const initializeMap = useCallback(() => {
    if (!data || !mapsLoaded || !mapRef.current) {
      console.log("Map initialization skipped:", {
        data: !!data,
        mapsLoaded,
        mapRef: !!mapRef.current,
      });
      return;
    }

    // Validate that we have valid center coordinates
    if (
      !data.center ||
      typeof data.center.lat !== "number" ||
      typeof data.center.lng !== "number"
    ) {
      console.error("Invalid center coordinates:", data.center);
      setMapError("Invalid map center coordinates");
      setIsInitializing(false);
      return;
    }

    // Validate that we have businesses with coordinates
    const businessesWithCoords = data.businesses.filter(
      (b) =>
        b.lat &&
        b.lng &&
        typeof b.lat === "number" &&
        typeof b.lng === "number" &&
        !isNaN(b.lat) &&
        !isNaN(b.lng)
    );

    if (businessesWithCoords.length === 0) {
      console.error("No businesses with valid coordinates found");
      setMapError("No businesses with valid coordinates to display");
      setIsInitializing(false);
      return;
    }

    try {
      setIsInitializing(true);
      setMapError(null);

      console.log("Initializing map with center:", data.center);
      console.log("Businesses with coordinates:", businessesWithCoords.length);

      // Clean up existing map elements
      cleanupMap();

      // Create or update map
      if (!mapInstanceRef.current) {
        mapInstanceRef.current = new window.google.maps.Map(mapRef.current, {
          center: data.center,
          zoom: 11,
          mapTypeControl: true,
          streetViewControl: true,
          fullscreenControl: true,
          zoomControl: false, // We'll add custom controls
          styles: [
            {
              featureType: "poi",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
            {
              featureType: "transit",
              elementType: "labels",
              stylers: [{ visibility: "off" }],
            },
          ],
        });

        console.log("Map instance created");
      } else {
        // Update existing map center
        mapInstanceRef.current.setCenter(data.center);
        console.log("Map center updated");
      }

      // Create info window (reuse single instance)
      if (!infoWindowRef.current) {
        infoWindowRef.current = new window.google.maps.InfoWindow();
      }

      // Add markers and circles for each business with valid coordinates
      businessesWithCoords.forEach((business, index) => {
        if (!mapInstanceRef.current) return;

        const position = { lat: business.lat!, lng: business.lng! };
        console.log(`Adding marker for ${business.name} at:`, position);

        // Create marker
        const marker = new window.google.maps.Marker({
          position: position,
          map: mapInstanceRef.current,
          icon: {
            path: window.google.maps.SymbolPath.CIRCLE,
            scale: business.isTarget ? 25 : business.rank! > 10 ? 20 : 18,
            fillColor: business.isTarget
              ? "#3b82f6" // Blue for target business
              : business.rank! > 10
              ? "#dc2626" // Red for low ranks
              : business.rank! > 3
              ? "#f59e0b" // Orange for medium ranks
              : "#10b981", // Green for top ranks
            fillOpacity: 0.8,
            strokeColor: business.isTarget ? "#1e40af" : "#ffffff",
            strokeWeight: business.isTarget ? 3 : 2,
          },
          label: {
            text: business.rank! > 20 ? "20+" : business.rank!.toString(),
            color: "#ffffff",
            fontSize: "12px",
            fontWeight: "bold",
          },
          title: business.name,
        });

        // Create info window content
        const infoContent = `
          <div class="p-3 min-w-48 max-w-64">
            <h3 class="font-semibold text-sm mb-2 ${
              business.isTarget ? "text-blue-600" : "text-gray-900"
            }">${business.name}</h3>
            <div class="text-xs text-gray-600 space-y-1">
              <p><strong>Rank:</strong> #${business.rank}</p>
              <p><strong>Visibility:</strong> ${business.visibility}%</p>
              <p><strong>Difficulty:</strong> ${business.difficulty}</p>
              ${
                business.rating
                  ? `<p><strong>Rating:</strong> ${business.rating} ⭐ (${
                      business.reviews || 0
                    } reviews)</p>`
                  : ""
              }
              ${
                business.isTarget
                  ? '<p class="text-blue-600 font-medium mt-2">🎯 Your Business</p>'
                  : ""
              }
              <p class="text-xs text-gray-500 mt-2">${business.address}</p>
            </div>
          </div>
        `;

        // Add click listener for info window
        marker.addListener("click", () => {
          if (infoWindowRef.current && mapInstanceRef.current) {
            infoWindowRef.current.setContent(infoContent);
            infoWindowRef.current.open(mapInstanceRef.current, marker);
          }
        });

        markersRef.current.push(marker);

        // Add visibility circle for top 10 businesses
        if (business.rank! <= 10) {
          const circle = new window.google.maps.Circle({
            strokeColor: business.isTarget
              ? "#3b82f6"
              : business.rank! > 10
              ? "#dc2626"
              : business.rank! > 3
              ? "#f59e0b"
              : "#10b981",
            strokeOpacity: 0.2,
            strokeWeight: 1,
            fillColor: business.isTarget
              ? "#3b82f6"
              : business.rank! > 10
              ? "#dc2626"
              : business.rank! > 3
              ? "#f59e0b"
              : "#10b981",
            fillOpacity: 0.08,
            map: mapInstanceRef.current,
            center: position,
            radius: business.rank! > 5 ? 1500 : 2500, // Smaller radius for lower ranks
          });

          circlesRef.current.push(circle);
        }
      });

      console.log(`Added ${markersRef.current.length} markers to map`);

      // Fit map to show all markers
      if (markersRef.current.length > 0) {
        const bounds = new window.google.maps.LatLngBounds();
        markersRef.current.forEach((marker) => {
          const position = marker.getPosition();
          if (position) {
            bounds.extend(position);
          }
        });

        mapInstanceRef.current.fitBounds(bounds);
        console.log("Map bounds fitted to markers");

        // Ensure minimum zoom level
        const listener = window.google.maps.event.addListener(
          mapInstanceRef.current,
          "idle",
          () => {
            if (mapInstanceRef.current!.getZoom() > 15) {
              mapInstanceRef.current!.setZoom(15);
            }
            window.google.maps.event.removeListener(listener);
          }
        );
      } else {
        // If no markers, just center on the provided location
        mapInstanceRef.current.setCenter(data.center);
        mapInstanceRef.current.setZoom(11);
      }

      setIsInitializing(false);
      console.log("Map initialization completed successfully");
    } catch (error) {
      console.error("Map initialization error:", error);
      setMapError(
        error instanceof Error ? error.message : "Failed to initialize map"
      );
      setIsInitializing(false);
    }
  }, [data, mapsLoaded, cleanupMap]);

  // Initialize map when data or maps loaded state changes
  useEffect(() => {
    if (mapsLoaded && data) {
      console.log("Effect triggered - initializing map");
      initializeMap();
    }
  }, [data, mapsLoaded, initializeMap]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      console.log("Cleaning up map on unmount");
      cleanupMap();
      if (infoWindowRef.current) {
        infoWindowRef.current.close();
      }
    };
  }, [cleanupMap]);

  const handleZoomIn = useCallback((): void => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 11;
      mapInstanceRef.current.setZoom(Math.min(currentZoom + 1, 20));
    }
  }, []);

  const handleZoomOut = useCallback((): void => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 11;
      mapInstanceRef.current.setZoom(Math.max(currentZoom - 1, 1));
    }
  }, []);

  const handleRecenter = useCallback((): void => {
    if (mapInstanceRef.current && data) {
      if (markersRef.current.length > 0) {
        // Fit to markers
        const bounds = new window.google.maps.LatLngBounds();
        markersRef.current.forEach((marker) => {
          const position = marker.getPosition();
          if (position) {
            bounds.extend(position);
          }
        });
        mapInstanceRef.current.fitBounds(bounds);
      } else {
        // Fallback to center
        mapInstanceRef.current.setCenter(data.center);
        mapInstanceRef.current.setZoom(11);
      }
    }
  }, [data]);

  // Show loading skeleton while maps are loading
  if (isLoading || (!mapsLoaded && !loadError)) {
    return <MapSkeleton />;
  }

  // Show error state if maps failed to load
  if (loadError) {
    return (
      <div className="w-full h-96 bg-red-50 rounded-lg border border-red-200 flex items-center justify-center">
        <div className="text-center p-6">
          <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3">
            <svg
              className="w-6 h-6 text-red-600"
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
          <h3 className="text-sm font-medium text-red-900 mb-2">
            Google Maps Failed to Load
          </h3>
          <p className="text-xs text-red-700 mb-3">{loadError}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-3 py-1 text-xs bg-red-600 text-white rounded hover:bg-red-700 transition-colors"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
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
            onClick={initializeMap}
            className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
          >
            Retry
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
      <div className="absolute top-4 right-4 flex flex-col space-y-2">
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
      <div className="absolute bottom-4 left-4 bg-white rounded-lg shadow-md p-3 max-w-48">
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
        <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md px-3 py-2">
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
