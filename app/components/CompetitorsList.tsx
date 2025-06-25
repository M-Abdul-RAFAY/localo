"use client";

import React, { useState } from "react";
import { Business } from "@/types";

interface CompetitorsListProps {
  competitors: Business[];
  targetBusiness?: Business;
}

type SortOption = "rank" | "visibility" | "rating";

const CompetitorsList: React.FC<CompetitorsListProps> = ({
  competitors,
  targetBusiness,
}) => {
  const [sortBy, setSortBy] = useState<SortOption>("rank");
  const [showAll, setShowAll] = useState<boolean>(false);
  const [selectedCompetitor, setSelectedCompetitor] = useState<Business | null>(
    null
  );

  const sortedCompetitors = [...competitors].sort((a, b) => {
    switch (sortBy) {
      case "rank":
        return (a.rank || 0) - (b.rank || 0);
      case "visibility":
        return (b.visibility || 0) - (a.visibility || 0);
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      default:
        return (a.rank || 0) - (b.rank || 0);
    }
  });

  const displayedCompetitors = showAll
    ? sortedCompetitors
    : sortedCompetitors.slice(0, 8);

  const getRankColor = (rank?: number): string => {
    if (!rank) return "text-gray-600 bg-gray-100";
    if (rank <= 3) return "text-green-600 bg-green-100";
    if (rank <= 10) return "text-orange-600 bg-orange-100";
    return "text-red-600 bg-red-100";
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

  const getVisibilityColor = (visibility?: number): string => {
    if (!visibility) return "bg-gray-300";
    if (visibility >= 70) return "bg-green-500";
    if (visibility >= 40) return "bg-yellow-500";
    return "bg-red-500";
  };

  const competitorsAhead = competitors.filter(
    (c) => (c.rank || 0) < (targetBusiness?.rank || 0)
  ).length;
  const competitorsBehind = competitors.filter(
    (c) => (c.rank || 0) > (targetBusiness?.rank || 999)
  ).length;
  const avgVisibility = Math.round(
    competitors.reduce((sum, c) => sum + (c.visibility || 0), 0) /
      competitors.length
  );

  const renderStars = (rating?: number): JSX.Element => {
    if (!rating) return <span className="text-gray-400">No rating</span>;

    const fullStars = Math.floor(rating);
    const hasHalfStar = rating % 1 >= 0.5;

    return (
      <div className="flex items-center">
        <div className="flex text-yellow-400">
          {"★".repeat(fullStars)}
          {hasHalfStar && "☆"}
          {"☆".repeat(5 - fullStars - (hasHalfStar ? 1 : 0))}
        </div>
      </div>
    );
  };

  const handleCompetitorClick = (competitor: Business): void => {
    setSelectedCompetitor(
      selectedCompetitor?.id === competitor.id ? null : competitor
    );
  };

  const getBusinessInitials = (name: string): string => {
    return name
      .split(" ")
      .map((word) => word[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();
  };

  if (competitors.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="text-center py-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-gray-400"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
              />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            No Competitors Found
          </h3>
          <p className="text-gray-600">
            Run an analysis to see your competitors in the local search results.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl font-semibold text-gray-900">
            Competitors Analysis ({competitors.length})
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Local search competition in your target area
          </p>
        </div>

        <div className="flex items-center space-x-3">
          <label className="text-sm font-medium text-gray-700">Sort by:</label>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="px-3 text-zinc-600 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="rank">Ranking</option>
            <option value="visibility">Visibility</option>
            <option value="rating">Rating</option>
          </select>
        </div>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="text-center">
          <div className="text-2xl font-bold text-gray-900">
            #{targetBusiness?.rank || "N/A"}
          </div>
          <div className="text-sm text-gray-600">Your Rank</div>
          {targetBusiness?.rank && (
            <div className="text-xs text-gray-500 mt-1">
              {targetBusiness.rank <= 3
                ? "Excellent"
                : targetBusiness.rank <= 10
                ? "Good"
                : "Needs Improvement"}
            </div>
          )}
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-green-600">
            {competitorsBehind}
          </div>
          <div className="text-sm text-gray-600">Behind You</div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round((competitorsBehind / competitors.length) * 100)}% of
            total
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-red-600">
            {competitorsAhead}
          </div>
          <div className="text-sm text-gray-600">Ahead of You</div>
          <div className="text-xs text-gray-500 mt-1">
            {Math.round((competitorsAhead / competitors.length) * 100)}% of
            total
          </div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">
            {avgVisibility}%
          </div>
          <div className="text-sm text-gray-600">Avg Visibility</div>
          <div className="text-xs text-gray-500 mt-1">
            {avgVisibility >= 50 ? "High competition" : "Moderate competition"}
          </div>
        </div>
      </div>

      {/* Competitors List */}
      <div className="space-y-3">
        {displayedCompetitors.map((competitor) => (
          <div
            key={competitor.id}
            className="border border-gray-200 rounded-lg overflow-hidden"
          >
            <div
              className="p-4 hover:bg-gray-50 cursor-pointer transition-colors"
              onClick={() => handleCompetitorClick(competitor)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  {/* Rank Badge */}
                  <div
                    className={`px-3 py-1 rounded-full text-sm font-bold ${getRankColor(
                      competitor.rank
                    )}`}
                  >
                    #{competitor.rank}
                  </div>

                  {/* Business Avatar */}
                  <div className="w-10 h-10 bg-gradient-to-br from-gray-400 to-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-xs font-bold">
                      {getBusinessInitials(competitor.name)}
                    </span>
                  </div>

                  {/* Business Info */}
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900 truncate">
                      {competitor.name}
                    </h4>
                    <div className="flex items-center space-x-4 mt-1">
                      {competitor.rating && (
                        <div className="flex items-center space-x-1">
                          {renderStars(competitor.rating)}
                          <span className="text-sm text-gray-600 ml-1">
                            ({competitor.rating}) • {competitor.reviews || 0}{" "}
                            reviews
                          </span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Metrics */}
                <div className="flex items-center space-x-6">
                  <div className="text-right">
                    <div className="text-sm font-medium text-gray-900 mb-1">
                      {competitor.visibility}% visible
                    </div>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all duration-300 ${getVisibilityColor(
                          competitor.visibility
                        )}`}
                        style={{ width: `${competitor.visibility}%` }}
                      />
                    </div>
                  </div>

                  <div
                    className={`px-2 py-1 rounded text-xs font-medium ${getDifficultyColor(
                      competitor.difficulty
                    )}`}
                  >
                    {competitor.difficulty}
                  </div>

                  <button
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium flex items-center"
                    type="button"
                  >
                    {selectedCompetitor?.id === competitor.id ? (
                      <>
                        Hide Details
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
                            d="M5 15l7-7 7 7"
                          />
                        </svg>
                      </>
                    ) : (
                      <>
                        View Details
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
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Expanded Details */}
            {selectedCompetitor?.id === competitor.id && (
              <div className="border-t border-gray-200 bg-gray-50 p-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Contact Information
                    </h5>
                    <div className="space-y-1 text-sm text-gray-600">
                      <div className="flex items-start">
                        <svg
                          className="w-4 h-4 mr-2 mt-0.5"
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
                        <span>{competitor.address}</span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Performance Metrics
                    </h5>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Search Visibility:
                        </span>
                        <span className="font-medium text-zinc-500">
                          {competitor.visibility}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">
                          Competition Level:
                        </span>
                        <span
                          className={`font-medium ${
                            competitor.difficulty === "LOW"
                              ? "text-green-600"
                              : competitor.difficulty === "MEDIUM"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {competitor.difficulty}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Local Rank:</span>
                        <span className="font-medium text-zinc-500">
                          #{competitor.rank}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h5 className="font-medium text-gray-900 mb-2">
                      Reputation
                    </h5>
                    <div className="space-y-2 text-sm">
                      {competitor.rating ? (
                        <>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Average Rating:
                            </span>
                            <span className="font-medium text-zinc-500">
                              {competitor.rating}/5.0
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Total Reviews:
                            </span>
                            <span className="font-medium text-zinc-500">
                              {competitor.reviews || 0}
                            </span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">
                              Review Quality:
                            </span>
                            <span className="font-medium text-zinc-500">
                              {competitor.rating >= 4.5
                                ? "Excellent"
                                : competitor.rating >= 4.0
                                ? "Very Good"
                                : competitor.rating >= 3.5
                                ? "Good"
                                : "Average"}
                            </span>
                          </div>
                        </>
                      ) : (
                        <div className="text-gray-500">
                          No review data available
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* <div className="mt-4 pt-4 border-t border-gray-200 flex justify-between items-center">
                  <div className="text-xs text-gray-500">
                    Click to view on map or analyze further
                  </div>
                  <div className="flex space-x-2">
                    <button
                      className="px-3 py-1 text-xs border border-gray-300 rounded hover:bg-white transition-colors"
                      type="button"
                    >
                      View on Map
                    </button>
                    <button
                      className="px-3 py-1 text-xs bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                      type="button"
                    >
                      Analyze Competitor
                    </button>
                  </div>
                </div> */}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Show More/Less Button */}
      {competitors.length > 8 && (
        <div className="mt-6 text-center">
          <button
            onClick={() => setShowAll(!showAll)}
            className="px-6 py-3 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 transition-colors"
            type="button"
          >
            {showAll ? (
              <>
                <svg
                  className="w-4 h-4 inline mr-2"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M5 15l7-7 7 7"
                  />
                </svg>
                Show Less
              </>
            ) : (
              <>
                <svg
                  className="w-4 h-4 inline mr-2"
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
                Show All {competitors.length} Competitors
              </>
            )}
          </button>
        </div>
      )}

      {/* Quick Actions */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
          <div className="text-sm text-gray-600">
            <strong>{displayedCompetitors.length}</strong> of{" "}
            <strong>{competitors.length}</strong> competitors shown
          </div>
          {/* <div className="flex space-x-3">
            <button
              className="px-4 py-2 text-gray-700 text-sm border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
              type="button"
            >
              Export List
            </button>
            <button
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              type="button"
            >
              Compare All
            </button>
          </div> */}
        </div>
      </div>
    </div>
  );
};

export default CompetitorsList;
