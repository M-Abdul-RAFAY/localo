// components/LoadingSkeletons.tsx
"use client";

import React from "react";

// Base skeleton component
const Skeleton: React.FC<{
  className?: string;
  animate?: boolean;
}> = ({ className = "", animate = true }) => (
  <div
    className={`bg-gray-200 rounded ${
      animate ? "animate-pulse" : ""
    } ${className}`}
  />
);

// Business search skeleton
export const BusinessSearchSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <Skeleton className="h-6 w-32 mb-4" />

    <div className="space-y-4">
      {/* Business Name Search */}
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Location Input */}
      <div>
        <Skeleton className="h-4 w-28 mb-2" />
        <div className="flex space-x-2">
          <Skeleton className="h-10 flex-1" />
          <Skeleton className="h-10 w-10" />
        </div>
      </div>

      {/* Keywords Input */}
      <div>
        <Skeleton className="h-4 w-32 mb-2" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-3 w-48 mt-1" />
      </div>

      {/* Quick Suggestions */}
      <div>
        <Skeleton className="h-3 w-28 mb-2" />
        <div className="flex flex-wrap gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <Skeleton key={i} className="h-6 w-20" />
          ))}
        </div>
      </div>

      {/* Analyze Button */}
      <Skeleton className="h-12 w-full" />
    </div>
  </div>
);

// Business list dropdown skeleton
export const BusinessListSkeleton: React.FC = () => (
  <div className="space-y-2 border border-gray-200 rounded-md max-h-60 overflow-hidden">
    {[1, 2, 3, 4].map((i) => (
      <div key={i} className="p-3 border-b border-gray-100 last:border-b-0">
        <Skeleton className="h-4 w-3/4 mb-1" />
        <Skeleton className="h-3 w-full mb-2" />
        <div className="flex items-center space-x-2">
          <Skeleton className="h-3 w-16" />
          <Skeleton className="h-3 w-20" />
        </div>
      </div>
    ))}
  </div>
);

// Competitors list skeleton
export const CompetitorsListSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-between mb-6">
      <div>
        <Skeleton className="h-6 w-48 mb-1" />
        <Skeleton className="h-4 w-64" />
      </div>
      <div className="flex items-center space-x-3">
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-8 w-24" />
      </div>
    </div>

    {/* Summary Stats */}
    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
      {[1, 2, 3, 4].map((i) => (
        <div key={i} className="text-center">
          <Skeleton className="h-8 w-12 mx-auto mb-1" />
          <Skeleton className="h-4 w-16 mx-auto mb-1" />
          <Skeleton className="h-3 w-20 mx-auto" />
        </div>
      ))}
    </div>

    {/* Competitors List */}
    <div className="space-y-3">
      {[1, 2, 3, 4, 5, 6].map((i) => (
        <div key={i} className="border border-gray-200 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-8 w-12 rounded-full" />
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 min-w-0">
                <Skeleton className="h-5 w-48 mb-1" />
                <div className="flex items-center space-x-4">
                  <Skeleton className="h-4 w-32" />
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              <div className="text-right">
                <Skeleton className="h-4 w-20 mb-1" />
                <Skeleton className="h-2 w-24" />
              </div>
              <Skeleton className="h-6 w-16" />
              <Skeleton className="h-4 w-20" />
            </div>
          </div>
        </div>
      ))}
    </div>
  </div>
);

// Map skeleton
export const MapSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <Skeleton className="h-6 w-32 mb-4" />
    <div className="relative">
      <Skeleton className="w-full h-96 rounded-lg" />
      {/* Floating controls skeleton */}
      <div className="absolute top-4 right-4 flex space-x-2">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-10 w-10 rounded-full" />
      </div>
      {/* Mock markers */}
      <div className="absolute top-20 left-20">
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <div className="absolute top-32 right-32">
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
      <div className="absolute bottom-20 left-1/3">
        <Skeleton className="h-6 w-6 rounded-full" />
      </div>
    </div>
  </div>
);

// Search filters skeleton
export const SearchFiltersSkeleton: React.FC = () => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <Skeleton className="h-5 w-28 mb-4" />

    <div className="space-y-6">
      {/* Search Radius */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-4 w-20" />
        </div>
        <Skeleton className="h-2 w-full mb-1" />
        <div className="flex justify-between">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-3 w-8" />
          ))}
        </div>
      </div>

      {/* Minimum Rating */}
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Max Results */}
      <div>
        <Skeleton className="h-4 w-28 mb-2" />
        <div className="grid grid-cols-4 gap-2">
          {[1, 2, 3, 4].map((i) => (
            <Skeleton key={i} className="h-10" />
          ))}
        </div>
      </div>

      {/* Sort By */}
      <div>
        <Skeleton className="h-4 w-24 mb-2" />
        <Skeleton className="h-10 w-full" />
      </div>

      {/* Toggle */}
      <div className="flex items-center justify-between">
        <div>
          <Skeleton className="h-4 w-32 mb-1" />
          <Skeleton className="h-3 w-40" />
        </div>
        <Skeleton className="h-6 w-11 rounded-full" />
      </div>

      {/* Quick Presets */}
      <div>
        <Skeleton className="h-4 w-24 mb-3" />
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="p-3 border border-gray-200 rounded-lg">
              <Skeleton className="h-4 w-32 mb-1" />
              <Skeleton className="h-3 w-48" />
            </div>
          ))}
        </div>
      </div>
    </div>
  </div>
);

// Generic data loading skeleton
export const DataLoadingSkeleton: React.FC<{
  title?: string;
  rows?: number;
}> = ({ title = "Loading data...", rows = 5 }) => (
  <div className="bg-white rounded-lg shadow-sm p-6">
    <div className="flex items-center justify-center py-8">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <Skeleton className="h-5 w-32 mx-auto mb-2" />
        <Skeleton className="h-4 w-48 mx-auto" />
      </div>
    </div>

    <div className="space-y-3 mt-6">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4">
          <Skeleton className="h-4 w-8" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-16" />
          <Skeleton className="h-4 w-12" />
        </div>
      ))}
    </div>
  </div>
);

// Loading spinner component
export const LoadingSpinner: React.FC<{
  size?: "small" | "medium" | "large";
  color?: string;
}> = ({ size = "medium", color = "border-blue-600" }) => {
  const sizeClasses = {
    small: "h-4 w-4",
    medium: "h-6 w-6",
    large: "h-8 w-8",
  };

  return (
    <div
      className={`animate-spin rounded-full border-b-2 ${color} ${sizeClasses[size]}`}
    />
  );
};

// Inline loading state for buttons
export const ButtonLoading: React.FC<{ text: string }> = ({ text }) => (
  <div className="flex items-center justify-center space-x-2">
    <LoadingSpinner size="small" color="border-current" />
    <span>{text}</span>
  </div>
);
