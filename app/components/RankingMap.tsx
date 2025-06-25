"use client";

import React, { useEffect, useRef } from "react";
import { RankingData } from "@/types";

interface RankingMapProps {
  data: RankingData;
}

const RankingMap: React.FC<RankingMapProps> = ({ data }) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<google.maps.Map | null>(null);

  useEffect(() => {
    if (!data || !window.google || !mapRef.current) return;
    const map = new window.google.maps.Map(mapRef.current, {
      center: data.center,
      zoom: 11,
      styles: [
        {
          featureType: "all",
          elementType: "geometry",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "all",
          elementType: "labels",
          stylers: [
            {
              visibility: "off",
            },
          ],
        },
        {
          featureType: "administrative",
          elementType: "geometry",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "administrative",
          elementType: "labels",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "landscape",
          elementType: "geometry",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "landscape",
          elementType: "labels",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "poi",
          elementType: "geometry",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "poi",
          elementType: "labels",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "road",
          elementType: "geometry",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "road",
          elementType: "labels",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "water",
          elementType: "geometry",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
        {
          featureType: "water",
          elementType: "labels",
          stylers: [
            {
              visibility: "on",
            },
          ],
        },
      ],
    });
    mapInstanceRef.current = map;
    data.businesses.forEach((business) => {
      const marker = new window.google.maps.Marker({
        position: { lat: business.lat!, lng: business.lng! },
        map: map,
        icon: {
          path: window.google.maps.SymbolPath.CIRCLE,
          scale: business.isTarget ? 25 : business.rank! > 10 ? 20 : 18,
          fillColor:
            business.rank! > 10
              ? "#dc2626"
              : business.rank! > 3
              ? "#f59e0b"
              : "#10b981",
          fillOpacity: 0.8,
          strokeColor: business.isTarget ? "#000000" : "#ffffff",
          strokeWeight: business.isTarget ? 3 : 2,
        },
        label: {
          text: business.rank! > 20 ? "20+" : business.rank!.toString(),
          color: "#ffffff",
          fontSize: "12px",
          fontWeight: "bold",
        },
      });
      const infoWindow = new window.google.maps.InfoWindow({
        content: `
          <div class="p-3 min-w-48">
            <h3 class="font-semibold text-sm mb-1">${business.name}</h3>
            <div class="text-xs text-gray-600 space-y-1">
              <p><strong>Rank:</strong> #${business.rank}</p>
              <p><strong>Visibility:</strong> ${business.visibility}%</p>
              <p><strong>Difficulty:</strong> ${business.difficulty}</p>
              ${
                business.rating
                  ? `<p><strong>Rating:</strong> ${business.rating} ⭐ (${business.reviews} reviews)</p>`
                  : ""
              }
              ${
                business.isTarget
                  ? '<p class="text-blue-600 font-medium">Your Business</p>'
                  : ""
              }
            </div>
          </div>
        `,
      });
      marker.addListener("click", () => {
        infoWindow.open(map, marker);
      });
      if (business.rank! <= 10) {
        new window.google.maps.Circle({
          strokeColor:
            business.rank! > 10
              ? "#dc2626"
              : business.rank! > 3
              ? "#f59e0b"
              : "#10b981",
          strokeOpacity: 0.2,
          strokeWeight: 1,
          fillColor:
            business.rank! > 10
              ? "#dc2626"
              : business.rank! > 3
              ? "#f59e0b"
              : "#10b981",
          fillOpacity: 0.08,
          map: map,
          center: { lat: business.lat!, lng: business.lng! },
          radius: business.rank! > 5 ? 1500 : 2500,
        });
      }
    });
  }, [data]);

  const handleZoomIn = (): void => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 11;
      mapInstanceRef.current.setZoom(currentZoom + 1);
    }
  };

  const handleZoomOut = (): void => {
    if (mapInstanceRef.current) {
      const currentZoom = mapInstanceRef.current.getZoom() || 11;
      mapInstanceRef.current.setZoom(currentZoom - 1);
    }
  };

  return (
    <div className="relative">
      <div
        ref={mapRef}
        className="w-full h-96 rounded-lg border border-gray-200"
      />
      <div className="absolute top-4 right-4 flex space-x-2">
        <button
          onClick={handleZoomIn}
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
          aria-label="Zoom in"
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
          className="p-2 bg-white rounded-full shadow-md hover:bg-gray-100 transition"
          aria-label="Zoom out"
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
      </div>
    </div>
  );
};

export default RankingMap;
