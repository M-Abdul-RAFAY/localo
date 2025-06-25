"use client";

import React, { useState, useEffect } from "react";
import { Business } from "@/types";
import { useDebounce } from "../hooks/useDebounce";
import { useGeolocation } from "../hooks/useGeolocation";

interface BusinessSearchProps {
  selectedBusiness: Business | null;
  onBusinessSelect: (business: Business | null) => void;
  location: string;
  onLocationChange: (location: string) => void;
  keywords: string;
  onKeywordsChange: (keywords: string) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

const BusinessSearch: React.FC<BusinessSearchProps> = ({
  selectedBusiness,
  onBusinessSelect,
  location,
  onLocationChange,
  keywords,
  onKeywordsChange,
  onAnalyze,
  isLoading,
}) => {
  const [businessName, setBusinessName] = useState<string>("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>("");
  const {
    getCurrentLocation,
    loading: locationLoading,
    error: locationError,
  } = useGeolocation();

  const debouncedBusinessName = useDebounce(businessName, 300);

  // Mock business search - replace with real Google Places API call
  const searchBusinesses = async (query: string): Promise<void> => {
    if (!query.trim()) {
      setBusinesses([]);
      setSearchError("");
      return;
    }

    setIsSearching(true);
    setSearchError("");

    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      // Mock API call - replace with actual Google Places API
      const mockResults: Business[] = [
        {
          id: 1,
          name: `${query} Security Services`,
          address: "123 Main St, Los Angeles, CA 90210",
          placeId: "mock_place_1",
          rating: 4.8,
          reviews: 127,
        },
        {
          id: 2,
          name: `${query} Solutions Inc`,
          address: "456 Oak Ave, Los Angeles, CA 90211",
          placeId: "mock_place_2",
          rating: 4.5,
          reviews: 89,
        },
        {
          id: 3,
          name: `Professional ${query}`,
          address: "789 Pine St, Los Angeles, CA 90212",
          placeId: "mock_place_3",
          rating: 4.2,
          reviews: 156,
        },
        {
          id: 4,
          name: `${query} Enterprise`,
          address: "321 Elm St, Los Angeles, CA 90213",
          placeId: "mock_place_4",
          rating: 4.6,
          reviews: 203,
        },
        {
          id: 5,
          name: `${query} Group LLC`,
          address: "654 Maple Ave, Los Angeles, CA 90214",
          placeId: "mock_place_5",
          rating: 4.3,
          reviews: 95,
        },
      ];

      setBusinesses(mockResults);
    } catch (error) {
      setSearchError("Failed to search businesses. Please try again.");
      setBusinesses([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search when debounced name changes
  useEffect(() => {
    if (debouncedBusinessName) {
      searchBusinesses(debouncedBusinessName);
    } else {
      setBusinesses([]);
      setSearchError("");
    }
  }, [debouncedBusinessName]);

  const handleUseCurrentLocation = async (): Promise<void> => {
    try {
      const position = await getCurrentLocation();
      if (position) {
        // In a real app, you'd reverse geocode the coordinates
        // For now, we'll use a mock location
        onLocationChange("Los Angeles, CA");
      }
    } catch (error) {
      console.error("Geolocation error:", error);
      alert("Could not get your location. Please enter manually.");
    }
  };

  const handleBusinessSelect = (business: Business): void => {
    onBusinessSelect(business);
    setBusinessName(business.name);
    setBusinesses([]); // Hide dropdown after selection
  };

  const clearBusinessSelection = (): void => {
    onBusinessSelect(null);
    setBusinessName("");
    setBusinesses([]);
  };

  const canAnalyze = selectedBusiness && location.trim() && keywords.trim();

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h2 className="text-lg font-semibold mb-4 text-zinc-900">
        Business Search
      </h2>

      <div className="space-y-4">
        {/* Business Name Search */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-2">
            Business Name *
          </label>
          <div className="relative">
            <input
              type="text"
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-700 placeholder:text-zinc-400"
              placeholder="Enter your business name..."
              disabled={isLoading}
            />

            {/* Loading Spinner */}
            {isSearching && (
              <div className="absolute right-10 top-2.5">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600" />
              </div>
            )}

            {/* Clear Button */}
            {businessName && (
              <button
                onClick={() => {
                  setBusinessName("");
                  clearBusinessSelection();
                }}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-300"
                type="button"
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </button>
            )}
          </div>

          {/* Search Error */}
          {searchError && (
            <p className="text-red-600 text-sm mt-1">{searchError}</p>
          )}
        </div>

        {/* Business Selection Dropdown */}
        {businesses.length > 0 && !selectedBusiness && (
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Select Your Business
            </label>
            <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
              {businesses.map((business) => (
                <div
                  key={business.id}
                  onClick={() => handleBusinessSelect(business)}
                  className="p-3 hover:bg-gray-50 cursor-pointer transition-colors border-b border-gray-100 last:border-b-0"
                >
                  <div className="font-medium text-sm text-gray-900">
                    {business.name}
                  </div>
                  <div className="text-xs text-gray-600 mt-1">
                    {business.address}
                  </div>
                  <div className="flex items-center space-x-2 mt-2">
                    <div className="flex text-yellow-400 text-xs">
                      {"★".repeat(Math.floor(business.rating || 0))}
                      {"☆".repeat(5 - Math.floor(business.rating || 0))}
                    </div>
                    <span className="text-xs text-gray-500">
                      ({business.rating}) • {business.reviews} reviews
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Selected Business Display */}
        {selectedBusiness && (
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Selected Business
            </label>
            <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h4 className="font-medium text-sm text-gray-900">
                    {selectedBusiness.name}
                  </h4>
                  <p className="text-xs text-gray-600 mt-1">
                    {selectedBusiness.address}
                  </p>
                  {selectedBusiness.rating && (
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex text-yellow-400 text-xs">
                        {"★".repeat(Math.floor(selectedBusiness.rating))}
                        {"☆".repeat(5 - Math.floor(selectedBusiness.rating))}
                      </div>
                      <span className="text-xs text-gray-500">
                        ({selectedBusiness.rating}) • {selectedBusiness.reviews}{" "}
                        reviews
                      </span>
                    </div>
                  )}
                </div>
                <button
                  onClick={clearBusinessSelection}
                  className="ml-2 text-gray-400 hover:text-gray-600"
                  type="button"
                  title="Change business"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Location Input */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-2">
            Target Location *
          </label>
          <div className="flex space-x-2">
            <input
              type="text"
              value={location}
              onChange={(e) => onLocationChange(e.target.value)}
              className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-700 placeholder:text-zinc-400
              00"
              placeholder="Los Angeles, CA"
              disabled={isLoading}
            />
            <button
              onClick={handleUseCurrentLocation}
              disabled={locationLoading || isLoading}
              className="px-3 py-2 border text-zinc-900 border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Use current location"
              type="button"
            >
              {locationLoading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600" />
              ) : (
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
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
              )}
            </button>
          </div>
          {locationError && (
            <p className="text-red-600 text-sm mt-1">{locationError}</p>
          )}
        </div>

        {/* Keywords Input */}
        <div>
          <label className="block text-sm font-medium text-zinc-900 mb-2">
            Search Keywords *
          </label>
          <input
            type="text"
            value={keywords}
            onChange={(e) => onKeywordsChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-700 placeholder:text-zinc-400"
            placeholder="security guard service"
            disabled={isLoading}
          />
          <p className="text-xs text-zinc-700 mt-1">
            Enter the main keywords customers use to find your business
          </p>
        </div>

        {/* Quick Keyword Suggestions */}
        <div>
          <p className="text-xs font-medium text-zinc-900 mb-2">
            Quick Suggestions:
          </p>
          <div className="flex flex-wrap text-zinc-700 gap-2">
            {[
              "security guard service",
              "private security",
              "security company",
              "security agency",
              "protection services",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => onKeywordsChange(suggestion)}
                className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded border transition-colors"
                type="button"
                disabled={isLoading}
              >
                {suggestion}
              </button>
            ))}
          </div>
        </div>

        {/* Analyze Button */}
        <button
          onClick={onAnalyze}
          disabled={!canAnalyze || isLoading}
          className={`w-full py-3 px-4 rounded-md font-medium transition-all ${
            canAnalyze && !isLoading
              ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
              : "bg-gray-200 text-gray-500 cursor-not-allowed"
          }`}
          type="button"
        >
          {isLoading ? (
            <div className="flex items-center justify-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-current" />
              <span>Analyzing Rankings...</span>
            </div>
          ) : (
            <div className="flex items-center justify-center space-x-2">
              <svg
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
                />
              </svg>
              <span>Analyze Rankings</span>
            </div>
          )}
        </button>

        {/* Help Text */}
        {!canAnalyze && (
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
            <div className="flex">
              <svg
                className="w-4 h-4 text-yellow-400 mt-0.5 mr-2 flex-shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
              <div>
                <p className="text-sm font-medium text-yellow-800">
                  Complete all fields to analyze rankings
                </p>
                <ul className="text-xs text-yellow-700 mt-1 space-y-1">
                  {!selectedBusiness && (
                    <li>• Select your business from search results</li>
                  )}
                  {!location.trim() && <li>• Enter target location</li>}
                  {!keywords.trim() && <li>• Add search keywords</li>}
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Tips Section */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
          <h4 className="text-sm font-medium text-zinc-900 mb-2">
            💡 Tips for Better Results
          </h4>
          <ul className="text-xs text-blue-800 space-y-1">
            <li>• Use specific keywords your customers search for</li>
            <li>• Include your city/area in the location field</li>
            <li>• Try variations of your business name if not found</li>
            <li>• Analysis covers a 25km radius by default</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default BusinessSearch;
