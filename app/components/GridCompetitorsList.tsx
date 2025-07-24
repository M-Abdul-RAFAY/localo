"use client";

import React, { useState } from "react";
import { Business } from "@/types";

interface GridCompetitorsListProps {
  competitors: Business[];
  targetBusiness?: Business;
  keywords: string[];
  selectedKeyword: string;
  onKeywordSelect: (keyword: string) => void;
}

const GridCompetitorsList: React.FC<GridCompetitorsListProps> = ({
  competitors,
  targetBusiness,
  keywords,
  selectedKeyword,
  onKeywordSelect,
}) => {
  const [expandedCompetitor, setExpandedCompetitor] = useState<string | null>(
    null
  );

  const getRankColor = (rank?: number): string => {
    if (!rank) return "bg-gray-100";
    if (rank === 1) return "bg-green-500";
    if (rank <= 3) return "bg-green-400";
    if (rank <= 5) return "bg-lime-400";
    if (rank <= 10) return "bg-yellow-400";
    if (rank <= 15) return "bg-orange-400";
    if (rank <= 20) return "bg-red-400";
    return "bg-red-600";
  };

  const getRankTextColor = (rank?: number): string => {
    if (!rank) return "text-gray-700";
    if (rank <= 10) return "text-gray-900";
    return "text-white";
  };

  const getDifficultyColor = (difficulty?: string): string => {
    switch (difficulty?.toLowerCase()) {
      case "low":
        return "text-green-700 bg-green-100";
      case "medium":
        return "text-yellow-700 bg-yellow-100";
      case "high":
        return "text-red-700 bg-red-100";
      default:
        return "text-gray-700 bg-gray-100";
    }
  };

  const getVisibilityBarColor = (visibility?: number): string => {
    if (!visibility) return "bg-gray-300";
    if (visibility >= 70) return "bg-green-500";
    if (visibility >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const renderStars = (rating?: number): JSX.Element => {
    if (!rating)
      return <span className="text-gray-400 text-xs">No rating</span>;

    return (
      <div className="flex items-center">
        <div className="flex text-yellow-400 text-xs">
          {"★".repeat(Math.floor(rating))}
          {"☆".repeat(5 - Math.floor(rating))}
        </div>
        <span className="ml-1 text-xs text-gray-600">
          ({rating.toFixed(1)})
        </span>
      </div>
    );
  };

  const handleCompetitorClick = (competitorId: string): void => {
    setExpandedCompetitor(
      expandedCompetitor === competitorId ? null : competitorId
    );
  };

  // Combine target business with competitors for display
  const allBusinesses = targetBusiness
    ? [targetBusiness, ...competitors]
    : competitors;

  return (
    <div className="bg-white rounded-lg shadow-sm p-6 h-full">
      <div className="mb-4">
        <h2 className="text-lg font-semibold text-gray-900 mb-2">
          Rankings Analysis
        </h2>

        {/* Keyword Selector */}
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Keyword
          </label>
          <select
            value={selectedKeyword}
            onChange={(e) => onKeywordSelect(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            {keywords.map((keyword, index) => (
              <option key={index} value={keyword}>
                {keyword}
              </option>
            ))}
          </select>
        </div>

        {/* Filters Section */}
        <div className="border-t border-gray-200 pt-3">
          <button className="text-sm text-gray-600 hover:text-gray-900 flex items-center">
            <span>Filters</span>
            <svg
              className="w-4 h-4 ml-1"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
          </button>

          <div className="mt-2 text-sm text-gray-600">
            Competitors ({competitors.length})
          </div>
        </div>
      </div>

      {/* Competitors List */}
      <div
        className="space-y-3 overflow-y-auto"
        style={{ maxHeight: "calc(100vh - 300px)" }}
      >
        {allBusinesses.map((business, index) => (
          <div
            key={business.id}
            className={`border rounded-lg overflow-hidden ${
              business.isTarget
                ? "border-blue-300 bg-blue-50"
                : "border-gray-200"
            }`}
          >
            <div
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleCompetitorClick(business.id.toString())}
            >
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  {/* Rank Badge */}
                  <div className="flex flex-col items-center">
                    <span className="text-xs text-gray-500 mb-1">
                      Rank {business.rank || index + 1}
                    </span>
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${getRankColor(
                        business.rank || index + 1
                      )} ${getRankTextColor(business.rank || index + 1)}`}
                    >
                      {business.rank || index + 1}
                    </div>
                  </div>

                  {/* Business Logo/Image */}
                  <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center overflow-hidden">
                    {business.isTarget ? (
                      <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-600 flex items-center justify-center">
                        <span className="text-white font-bold text-lg">
                          {business.name.substring(0, 2).toUpperCase()}
                        </span>
                      </div>
                    ) : (
                      <img
                        src={`https://via.placeholder.com/64x64.png?text=${encodeURIComponent(
                          business.name.substring(0, 2).toUpperCase()
                        )}`}
                        alt={business.name}
                        className="w-full h-full object-cover"
                      />
                    )}
                  </div>

                  {/* Business Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {business.name}
                      {business.isTarget && (
                        <span className="ml-2 text-xs bg-blue-600 text-white px-2 py-1 rounded">
                          Your Business
                        </span>
                      )}
                    </h4>
                    <p className="text-xs text-gray-600 mt-1">
                      {business.address || "No address"}
                    </p>
                    <div className="mt-2">{renderStars(business.rating)}</div>
                  </div>
                </div>

                {/* Expand/Collapse Icon */}
                <div className="ml-2">
                  <svg
                    className={`w-5 h-5 text-gray-400 transform transition-transform ${
                      expandedCompetitor === business.id.toString()
                        ? "rotate-180"
                        : ""
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M19 9l-7 7-7-7"
                    />
                  </svg>
                </div>
              </div>

              {/* Quick Metrics */}
              <div className="mt-3 grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-gray-500">
                    Business Visibility
                  </label>
                  <div className="mt-1">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getVisibilityBarColor(
                          business.visibility
                        )}`}
                        style={{ width: `${business.visibility || 0}%` }}
                      />
                    </div>
                    <p className="text-xs text-gray-600 mt-1">
                      {business.visibility || 0}%
                    </p>
                  </div>
                </div>
                <div>
                  <label className="text-xs text-gray-500">
                    Area Difficulty
                  </label>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                        business.difficulty
                      )}`}
                    >
                      {business.difficulty || "UNKNOWN"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Open in Google Link */}
              <div className="mt-3">
                <a
                  href={`https://www.google.com/search?q=${encodeURIComponent(
                    business.name + " " + business.address
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-xs text-blue-600 hover:text-blue-800 flex items-center"
                  onClick={(e) => e.stopPropagation()}
                >
                  Open in Google
                  <svg
                    className="w-3 h-3 ml-1"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                    />
                  </svg>
                </a>
              </div>
            </div>

            {/* Expanded Details */}
            {expandedCompetitor === business.id.toString() && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Performance Metrics
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Search Rank:</span>
                        <span className="font-medium">
                          #{business.rank || index + 1}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Visibility Score:</span>
                        <span className="font-medium">
                          {business.visibility || 0}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Competition Level:
                        </span>
                        <span className="font-medium">
                          {business.difficulty || "UNKNOWN"}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Business Details
                    </h5>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Rating:</span>
                        <span className="font-medium">
                          {business.rating || "N/A"}/5.0
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Reviews:</span>
                        <span className="font-medium">
                          {business.reviews || 0}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Category:</span>
                        <span className="font-medium">Security Service</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default GridCompetitorsList;
