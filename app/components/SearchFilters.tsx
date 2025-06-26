"use client";

import React, { useState } from "react";
import { SearchFilters as SearchFiltersType } from "@/types";

export interface SearchFiltersProps {
  filters: SearchFiltersType;
  onFiltersChange: (filters: SearchFiltersType) => void;
  onApplyFilters?: () => void;
  showGrid?: boolean;
  onToggleGrid?: (show: boolean) => void;
  gridDensity?: "default" | "dense" | "wide";
  onGridDensityChange?: (density: "default" | "dense" | "wide") => void;
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  showGrid = true,
  onToggleGrid,
  gridDensity = "default",
  onGridDensityChange,
}) => {
  const [resetConfirm, setResetConfirm] = useState<boolean>(false);

  const updateFilter = <K extends keyof SearchFiltersType>(
    key: K,
    value: SearchFiltersType[K]
  ): void => {
    const newFilters = { ...filters, [key]: value };
    onFiltersChange(newFilters);

    // Automatically trigger re-analysis if callback provided
    if (onApplyFilters) {
      // Debounce the re-analysis to avoid too many API calls
      setTimeout(() => {
        onApplyFilters();
      }, 500);
    }
  };

  const resetFilters = (): void => {
    const defaultFilters: SearchFiltersType = {
      radius: 25,
      minRating: 0,
      maxResults: 20,
      includeReviews: true,
      sortBy: "relevance",
    };
    onFiltersChange(defaultFilters);
    setResetConfirm(false);

    if (onApplyFilters) {
      setTimeout(() => {
        onApplyFilters();
      }, 500);
    }
  };

  const getRadiusLabel = (radius: number): string => {
    if (radius < 10) return "Very Local";
    if (radius < 25) return "Local";
    if (radius < 50) return "Regional";
    return "Wide Area";
  };

  const hasCustomFilters = (): boolean => {
    return (
      filters.radius !== 25 ||
      filters.minRating !== 0 ||
      filters.maxResults !== 20 ||
      !filters.includeReviews ||
      filters.sortBy !== "relevance"
    );
  };

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <h3 className="font-semibold text-gray-900 mb-4">Search Filters</h3>

      <div className="space-y-6">
        {/* Grid Overlay Controls */}
        <div className="border-b border-gray-200 pb-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">
            Grid Overlay
          </h4>

          {/* Toggle Grid */}
          <div className="flex items-center justify-between mb-4">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Show Analysis Grid
              </label>
              <p className="text-xs text-gray-500">
                Display geo-grid points for ranking analysis
              </p>
            </div>
            <button
              onClick={() => onToggleGrid && onToggleGrid(!showGrid)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                showGrid ? "bg-blue-600" : "bg-gray-200"
              }`}
              type="button"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  showGrid ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Grid Density */}
          {showGrid && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Grid Density
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() =>
                    onGridDensityChange && onGridDensityChange("default")
                  }
                  className={`py-2 px-3 text-sm rounded-md border transition-colors ${
                    gridDensity === "default"
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  type="button"
                >
                  Default
                </button>
                <button
                  onClick={() =>
                    onGridDensityChange && onGridDensityChange("dense")
                  }
                  className={`py-2 px-3 text-sm rounded-md border transition-colors ${
                    gridDensity === "dense"
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  type="button"
                >
                  Dense
                </button>
                <button
                  onClick={() =>
                    onGridDensityChange && onGridDensityChange("wide")
                  }
                  className={`py-2 px-3 text-sm rounded-md border transition-colors ${
                    gridDensity === "wide"
                      ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                      : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                  }`}
                  type="button"
                >
                  Wide
                </button>
              </div>
              <div className="mt-2 text-xs text-gray-500">
                {gridDensity === "default" &&
                  "7 rings up to 3.5km, standard coverage"}
                {gridDensity === "dense" &&
                  "7 rings up to 2.5km, detailed analysis"}
                {gridDensity === "wide" &&
                  "7 rings up to 15km, broad market coverage"}
              </div>
            </div>
          )}
        </div>

        {/* Search Radius */}
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Search Radius
            </label>
            <span className="text-sm font-medium text-blue-600">
              {filters.radius} km ({getRadiusLabel(filters.radius)})
            </span>
          </div>
          <input
            type="range"
            min="5"
            max="100"
            step="5"
            value={filters.radius}
            onChange={(e) => updateFilter("radius", parseInt(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
            style={{
              background: `linear-gradient(to right, #3b82f6 0%, #3b82f6 ${
                ((filters.radius - 5) / 95) * 100
              }%, #e5e7eb ${((filters.radius - 5) / 95) * 100}%, #e5e7eb 100%)`,
            }}
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>5 km</span>
            <span>25 km</span>
            <span>50 km</span>
            <span>100 km</span>
          </div>
        </div>

        {/* Minimum Rating */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Minimum Rating
          </label>
          <select
            value={filters.minRating}
            onChange={(e) =>
              updateFilter("minRating", parseFloat(e.target.value))
            }
            className="w-full px-3 py-2 text-zinc-600 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value={0}>Any Rating</option>
            <option value={3.0}>3.0+ Stars</option>
            <option value={3.5}>3.5+ Stars</option>
            <option value={4.0}>4.0+ Stars</option>
            <option value={4.5}>4.5+ Stars</option>
            <option value={5.0}>5.0 Stars Only</option>
          </select>
        </div>

        {/* Max Results */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Maximum Results
          </label>
          <div className="grid grid-cols-4 gap-2">
            {[10, 20, 50, 100].map((count) => (
              <button
                key={count}
                onClick={() => updateFilter("maxResults", count)}
                className={`py-2 px-3 text-sm rounded-md border transition-colors ${
                  filters.maxResults === count
                    ? "border-blue-500 bg-blue-50 text-blue-700 font-medium"
                    : "border-gray-300 text-gray-700 hover:border-gray-400 hover:bg-gray-50"
                }`}
                type="button"
              >
                {count}
              </button>
            ))}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            Higher numbers may take longer to load
          </p>
        </div>

        {/* Sort By */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sort Results By
          </label>
          <select
            value={filters.sortBy}
            onChange={(e) =>
              updateFilter(
                "sortBy",
                e.target.value as SearchFiltersType["sortBy"]
              )
            }
            className="w-full text-zinc-600 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="relevance">Relevance (Default)</option>
            <option value="distance">Distance (Nearest First)</option>
            <option value="rating">Rating (Highest First)</option>
            <option value="reviews">Reviews (Most First)</option>
          </select>
        </div>

        {/* Include Reviews Toggle */}
        <div>
          <div className="flex items-center justify-between">
            <div>
              <label className="text-sm font-medium text-gray-700">
                Include Review Data
              </label>
              <p className="text-xs text-gray-500">
                Fetch ratings and review counts (slower but more accurate)
              </p>
            </div>
            <button
              onClick={() =>
                updateFilter("includeReviews", !filters.includeReviews)
              }
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                filters.includeReviews ? "bg-blue-600" : "bg-gray-200"
              }`}
              type="button"
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  filters.includeReviews ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>

        {/* Quick Presets */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-3">
            Quick Presets
          </label>
          <div className="grid grid-cols-1 gap-2">
            <button
              onClick={() =>
                onFiltersChange({
                  radius: 10,
                  minRating: 4.0,
                  maxResults: 10,
                  includeReviews: true,
                  sortBy: "rating",
                })
              }
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              <div className="font-medium text-zinc-600 text-sm">
                High Quality Nearby
              </div>
              <div className="text-xs text-gray-500">
                4.0+ stars, 10km radius, top 10 results
              </div>
            </button>

            <button
              onClick={() =>
                onFiltersChange({
                  radius: 50,
                  minRating: 0,
                  maxResults: 50,
                  includeReviews: true,
                  sortBy: "relevance",
                })
              }
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              <div className="font-medium text-zinc-600 text-sm">
                Comprehensive Analysis
              </div>
              <div className="text-xs text-gray-500">
                All businesses, 50km radius, top 50 results
              </div>
            </button>

            <button
              onClick={() =>
                onFiltersChange({
                  radius: 15,
                  minRating: 3.5,
                  maxResults: 20,
                  includeReviews: true,
                  sortBy: "distance",
                })
              }
              className="p-3 text-left border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              <div className="font-medium text-zinc-600 text-sm">
                Local Competitors
              </div>
              <div className="text-xs text-gray-500">
                3.5+ stars, 15km radius, sorted by distance
              </div>
            </button>
          </div>
        </div>

        {/* Apply Filters Button */}
        {hasCustomFilters() && onApplyFilters && (
          <div className="pt-4 border-t border-gray-200">
            <button
              onClick={onApplyFilters}
              className="w-full py-2 px-4 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors font-medium"
              type="button"
            >
              Apply Filters & Re-analyze
            </button>
          </div>
        )}

        {/* Reset Button */}
        {hasCustomFilters() && (
          <div
            className={`${
              hasCustomFilters() && onApplyFilters
                ? ""
                : "pt-4 border-t border-gray-200"
            }`}
          >
            {resetConfirm ? (
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">
                  Reset all filters to default?
                </span>
                <div className="flex space-x-2">
                  <button
                    onClick={() => setResetConfirm(false)}
                    className="px-3 py-1 text-sm border border-gray-300 rounded hover:bg-gray-50"
                    type="button"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={resetFilters}
                    className="px-3 py-1 text-sm bg-red-500 text-white rounded hover:bg-red-600"
                    type="button"
                  >
                    Reset
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setResetConfirm(true)}
                className="w-full py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
                type="button"
              >
                Reset to Default Settings
              </button>
            )}
          </div>
        )}

        {/* Active Filters Summary */}
        {hasCustomFilters() && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <h4 className="text-sm font-medium text-blue-900 mb-1">
              Active Filters:
            </h4>
            <div className="text-xs text-blue-800 space-y-1">
              {filters.radius !== 25 && <div>• Radius: {filters.radius}km</div>}
              {filters.minRating > 0 && (
                <div>• Min Rating: {filters.minRating}+ stars</div>
              )}
              {filters.maxResults !== 20 && (
                <div>• Max Results: {filters.maxResults}</div>
              )}
              {!filters.includeReviews && <div>• Reviews: Excluded</div>}
              {filters.sortBy !== "relevance" && (
                <div>• Sort: {filters.sortBy}</div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchFilters;
