"use client";

import React, { useState, useEffect, useMemo, useRef } from "react";
import { Business } from "@/types";
import { useDebounce } from "../hooks/useDebounce";
import { useGeolocation } from "../hooks/useGeolocation";
import { useGoogleMaps } from "../hooks/useGoogleMaps";
import { RealGooglePlacesService } from "@/lib/realGooglePlaces";
import { ErrorBoundary, DataErrorFallback } from "./ErrorBoundary";
import {
  BusinessListSkeleton,
  LoadingSpinner,
  ButtonLoading,
} from "./LoadingSkeletons";

interface BusinessSearchProps {
  selectedBusiness: Business | null;
  onBusinessSelect: (business: Business | null) => void;
  location: string;
  onLocationChange: (location: string) => void;
  keywords: string[];
  onKeywordsChange: (keywords: string[]) => void;
  maxCompetitors: number;
  onMaxCompetitorsChange: (max: number) => void;
  onAnalyze: () => void;
  isLoading: boolean;
}

interface LocationSuggestion {
  description: string;
  place_id: string;
  structured_formatting: {
    main_text: string;
    secondary_text: string;
  };
}

const BusinessSearch: React.FC<BusinessSearchProps> = ({
  selectedBusiness,
  onBusinessSelect,
  location,
  onLocationChange,
  keywords,
  onKeywordsChange,
  maxCompetitors,
  onMaxCompetitorsChange,
  onAnalyze,
  isLoading,
}) => {
  const [businessName, setBusinessName] = useState<string>("");
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchError, setSearchError] = useState<string>("");
  const [hasSearched, setHasSearched] = useState<boolean>(false);
  const [currentKeyword, setCurrentKeyword] = useState<string>("");

  // Location suggestions state
  const [showLocationSuggestions, setShowLocationSuggestions] =
    useState<boolean>(false);
  const [locationSuggestions, setLocationSuggestions] = useState<
    LocationSuggestion[]
  >([]);
  const [isLoadingLocationSuggestions, setIsLoadingLocationSuggestions] =
    useState<boolean>(false);

  // Refs for Google services
  const autocompleteServiceRef =
    useRef<google.maps.places.AutocompleteService | null>(null);
  const placesServiceRef = useRef<google.maps.places.PlacesService | null>(
    null
  );

  const {
    getCurrentLocation,
    loading: locationLoading,
    error: locationError,
  } = useGeolocation();

  const {
    isLoaded: mapsLoaded,
    loadError: mapsError,
    isLoading: mapsLoading,
  } = useGoogleMaps();

  const debouncedBusinessName = useDebounce(businessName, 500);
  const debouncedLocation = useDebounce(location, 300);

  // Initialize Google Places service
  const placesService = useMemo(() => {
    if (mapsLoaded) {
      return new RealGooglePlacesService({
        apiKey: process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY || "",
      });
    }
    return null;
  }, [mapsLoaded]);

  // Initialize Google services when maps are loaded
  useEffect(() => {
    if (mapsLoaded && window.google) {
      autocompleteServiceRef.current =
        new window.google.maps.places.AutocompleteService();

      const mapDiv = document.createElement("div");
      placesServiceRef.current = new window.google.maps.places.PlacesService(
        mapDiv
      );

      console.log("Google Places Autocomplete service initialized");
    }
  }, [mapsLoaded]);

  // Get location suggestions from Google Places Autocomplete
  const getLocationSuggestions = async (input: string): Promise<void> => {
    if (!input.trim() || input.length < 2 || !autocompleteServiceRef.current) {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      return;
    }

    setIsLoadingLocationSuggestions(true);

    try {
      const request: google.maps.places.AutocompletionRequest = {
        input: input,
      };

      autocompleteServiceRef.current.getPlacePredictions(
        request,
        (predictions, status) => {
          if (
            status === google.maps.places.PlacesServiceStatus.OK &&
            predictions
          ) {
            const suggestions: LocationSuggestion[] = predictions.map(
              (prediction) => ({
                description: prediction.description,
                place_id: prediction.place_id || "",
                structured_formatting: {
                  main_text:
                    prediction.structured_formatting?.main_text ||
                    prediction.description,
                  secondary_text:
                    prediction.structured_formatting?.secondary_text || "",
                },
              })
            );

            setLocationSuggestions(suggestions.slice(0, 5));
            setShowLocationSuggestions(suggestions.length > 0);
          } else {
            setLocationSuggestions([]);
            setShowLocationSuggestions(false);
          }

          setIsLoadingLocationSuggestions(false);
        }
      );
    } catch (error) {
      console.error("Error getting location suggestions:", error);
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
      setIsLoadingLocationSuggestions(false);
    }
  };

  // Update location suggestions based on input
  useEffect(() => {
    if (debouncedLocation.length > 1 && mapsLoaded) {
      getLocationSuggestions(debouncedLocation);
    } else {
      setLocationSuggestions([]);
      setShowLocationSuggestions(false);
    }
  }, [debouncedLocation, mapsLoaded]);

  // Real business search using Google Places API
  const searchBusinesses = async (query: string): Promise<void> => {
    if (!query.trim() || query.length < 2) {
      setBusinesses([]);
      setSearchError("");
      setHasSearched(false);
      return;
    }

    if (!placesService) {
      setSearchError("Google Maps is still loading. Please wait...");
      return;
    }

    if (!location.trim()) {
      setSearchError("Please enter a location first");
      return;
    }

    setIsSearching(true);
    setSearchError("");
    setHasSearched(true);

    try {
      const results = await placesService.searchBusinesses(
        query,
        location,
        25000
      );
      setBusinesses(results);

      if (results.length === 0) {
        setSearchError(
          "No businesses found. Try a different search term or location."
        );
      }
    } catch (error) {
      console.error("Business search failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Search failed";
      setSearchError(`Search failed: ${errorMessage}`);
      setBusinesses([]);
    } finally {
      setIsSearching(false);
    }
  };

  // Auto-search when debounced name changes
  useEffect(() => {
    if (debouncedBusinessName && mapsLoaded) {
      searchBusinesses(debouncedBusinessName);
    } else if (!debouncedBusinessName) {
      setBusinesses([]);
      setSearchError("");
      setHasSearched(false);
    }
  }, [debouncedBusinessName, mapsLoaded, location]);

  const handleUseCurrentLocation = async (): Promise<void> => {
    try {
      const position = await getCurrentLocation();
      if (position) {
        if (placesService && window.google) {
          const geocoder = new window.google.maps.Geocoder();
          const latlng = new window.google.maps.LatLng(
            position.lat,
            position.lng
          );

          geocoder.geocode({ location: latlng }, (results, status) => {
            if (status === "OK" && results?.[0]) {
              const address = results[0].formatted_address;
              onLocationChange(address);
              setShowLocationSuggestions(false);
            } else {
              const coordsString = `${position.lat.toFixed(
                4
              )}, ${position.lng.toFixed(4)}`;
              onLocationChange(coordsString);
              setShowLocationSuggestions(false);
            }
          });
        } else {
          const coordsString = `${position.lat.toFixed(
            4
          )}, ${position.lng.toFixed(4)}`;
          onLocationChange(coordsString);
          setShowLocationSuggestions(false);
        }
      }
    } catch (error) {
      console.error("Geolocation error:", error);
      alert(
        "Could not get your location. Please enter manually or check location permissions."
      );
    }
  };

  const handleBusinessSelect = (business: Business): void => {
    onBusinessSelect(business);
    setBusinessName(business.name);
    setBusinesses([]);
    setHasSearched(false);
  };

  const clearBusinessSelection = (): void => {
    onBusinessSelect(null);
    setBusinessName("");
    setBusinesses([]);
    setHasSearched(false);
  };

  const handleLocationSuggestionClick = async (
    suggestion: LocationSuggestion
  ): Promise<void> => {
    onLocationChange(suggestion.description);
    setShowLocationSuggestions(false);
    setLocationSuggestions([]);
    setIsLoadingLocationSuggestions(false);
  };

  const handleLocationInputFocus = (): void => {
    if (location.length > 1 && locationSuggestions.length > 0) {
      setShowLocationSuggestions(true);
    }
  };

  const handleLocationInputBlur = (): void => {
    setTimeout(() => {
      setShowLocationSuggestions(false);
    }, 300);
  };

  const handleLocationInputKeyDown = (e: React.KeyboardEvent): void => {
    if (e.key === "Escape") {
      setShowLocationSuggestions(false);
      setLocationSuggestions([]);
    }
  };

  const handleAddKeyword = (): void => {
    if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
      onKeywordsChange([...keywords, currentKeyword.trim()]);
      setCurrentKeyword("");
    }
  };

  const handleRemoveKeyword = (index: number): void => {
    const newKeywords = keywords.filter((_, i) => i !== index);
    onKeywordsChange(newKeywords);
  };

  const canAnalyze = selectedBusiness && location.trim() && keywords.length > 0;

  // Show Google Maps loading state
  if (mapsLoading) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex items-center justify-center py-8">
          <div className="text-center">
            <LoadingSpinner size="large" />
            <p className="mt-4 text-gray-600">Loading Google Maps...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show Google Maps error state
  if (mapsError) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <svg
              className="w-5 h-5 text-red-400 mt-0.5 mr-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <div>
              <h3 className="text-sm font-medium text-red-800">
                Google Maps Failed to Load
              </h3>
              <p className="text-sm text-red-700 mt-1">{mapsError}</p>
              <button
                onClick={() => window.location.reload()}
                className="mt-2 text-sm bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <ErrorBoundary fallback={DataErrorFallback}>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
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
                disabled={isLoading || !mapsLoaded}
              />

              {isSearching && (
                <div className="absolute right-10 top-2.5">
                  <LoadingSpinner size="small" />
                </div>
              )}

              {businessName && (
                <button
                  onClick={() => {
                    setBusinessName("");
                    clearBusinessSelection();
                  }}
                  className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
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

            {/* Business Selection Dropdown */}
            {isSearching && <BusinessListSkeleton />}

            {businesses.length > 0 && !selectedBusiness && !isSearching && (
              <div className="mt-2">
                <div className="space-y-2 max-h-60 overflow-y-auto border border-gray-200 rounded-md">
                  {businesses.slice(0, 5).map((business) => (
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
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Selected Business Display */}
            {selectedBusiness && (
              <div className="mt-2">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm text-gray-900">
                        {selectedBusiness.name}
                      </h4>
                      <p className="text-xs text-gray-600 mt-1">
                        {selectedBusiness.address}
                      </p>
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
          </div>

          {/* Location Input */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Target Location *
            </label>
            <div className="flex space-x-2">
              <div className="flex-1 relative">
                <input
                  type="text"
                  value={location}
                  onChange={(e) => onLocationChange(e.target.value)}
                  onFocus={handleLocationInputFocus}
                  onBlur={handleLocationInputBlur}
                  onKeyDown={handleLocationInputKeyDown}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-700 placeholder:text-zinc-400"
                  placeholder="Enter city or address..."
                  disabled={isLoading}
                />

                {isLoadingLocationSuggestions && (
                  <div className="absolute right-3 top-2.5">
                    <LoadingSpinner size="small" />
                  </div>
                )}

                {/* Location Suggestions Dropdown */}
                {showLocationSuggestions && locationSuggestions.length > 0 && (
                  <div className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-md shadow-lg max-h-48 overflow-y-auto">
                    {locationSuggestions.map((suggestion, index) => (
                      <button
                        key={suggestion.place_id || index}
                        type="button"
                        className="w-full px-3 py-2 text-left hover:bg-gray-100 transition-colors border-b border-gray-100 last:border-b-0"
                        onClick={() =>
                          handleLocationSuggestionClick(suggestion)
                        }
                      >
                        <div className="text-sm font-medium text-gray-900">
                          {suggestion.structured_formatting.main_text}
                        </div>
                        {suggestion.structured_formatting.secondary_text && (
                          <div className="text-xs text-gray-600">
                            {suggestion.structured_formatting.secondary_text}
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                onClick={handleUseCurrentLocation}
                disabled={locationLoading || isLoading || !mapsLoaded}
                className="px-3 py-2 border rounded-full text-white border-gray-300 bg-blue-700 hover:bg-blue-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                title="Use current location"
                type="button"
              >
                {locationLoading ? (
                  <LoadingSpinner size="small" />
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
              Keywords *
            </label>
            <div className="flex space-x-2">
              <input
                type="text"
                value={currentKeyword}
                onChange={(e) => setCurrentKeyword(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddKeyword();
                  }
                }}
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-700 placeholder:text-zinc-400"
                placeholder="e.g., security guard service"
                disabled={isLoading}
              />
              <button
                onClick={handleAddKeyword}
                disabled={!currentKeyword.trim() || isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                type="button"
              >
                Add
              </button>
            </div>

            {/* Keywords List */}
            {keywords.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-2">
                {keywords.map((keyword, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                  >
                    {keyword}
                    <button
                      onClick={() => handleRemoveKeyword(index)}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                      type="button"
                    >
                      <svg
                        className="w-3 h-3"
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
                  </span>
                ))}
              </div>
            )}
          </div>

          {/* Max Competitors */}
          <div>
            <label className="block text-sm font-medium text-zinc-900 mb-2">
              Max Competitors
            </label>
            <select
              value={maxCompetitors}
              onChange={(e) => onMaxCompetitorsChange(parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-zinc-700"
              disabled={isLoading}
            >
              <option value={10}>10 Competitors</option>
              <option value={20}>20 Competitors</option>
              <option value={30}>30 Competitors</option>
              <option value={50}>50 Competitors</option>
              <option value={100}>100 Competitors</option>
            </select>
          </div>
        </div>

        {/* Analyze Button */}
        <div className="mt-6">
          <button
            onClick={onAnalyze}
            disabled={!canAnalyze || isLoading || !mapsLoaded}
            className={`w-full py-3 px-4 rounded-md font-medium transition-all ${
              canAnalyze && !isLoading && mapsLoaded
                ? "bg-blue-600 text-white hover:bg-blue-700 shadow-md hover:shadow-lg transform hover:scale-[1.02]"
                : "bg-gray-200 text-gray-500 cursor-not-allowed"
            }`}
            type="button"
          >
            {isLoading ? (
              <ButtonLoading text="Analyzing Rankings..." />
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
            <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
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
                    {keywords.length === 0 && (
                      <li>• Add at least one keyword</li>
                    )}
                    {!mapsLoaded && <li>• Waiting for Google Maps to load</li>}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default BusinessSearch;
