"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Business,
  SearchFilters as SearchFiltersType,
  RankingData,
} from "@/types";
import BusinessSearch from "./components/BusinessSearch";
import CompetitorsList from "./components/CompetitorsList";
import SearchFiltersComponent from "./components/SearchFilters";
import ExportOptions from "./components/ExportOptions";
import { ErrorBoundary, DataErrorFallback } from "./components/ErrorBoundary";
import {
  DataLoadingSkeleton,
  BusinessSearchSkeleton,
  SearchFiltersSkeleton,
} from "./components/LoadingSkeletons";

// Dynamically import map component to avoid SSR issues
const RankingMap = dynamic(() => import("./components/RankingMap"), {
  ssr: false,
  loading: () => (
    <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-4"></div>
      <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg" />
    </div>
  ),
});

// API client for making requests
class ApiClient {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(
        errorData.error || `Request failed with status ${response.status}`
      );
    }

    const data = await response.json();
    if (!data.success) {
      throw new Error(data.error || "Request failed");
    }

    return data.data;
  }

  async analyzeRankings(
    business: Business,
    location: string,
    keywords: string,
    filters?: SearchFiltersType
  ): Promise<RankingData> {
    try {
      const response = await fetch("/api/analyze-rankings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business,
          location,
          keywords,
          filters,
        }),
      });

      return this.handleResponse<RankingData>(response);
    } catch (error) {
      console.error("API request failed:", error);
      throw error;
    }
  }
}

const HomePage: React.FC = () => {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  const [location, setLocation] = useState<string>("");
  const [keywords, setKeywords] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [filters, setFilters] = useState<SearchFiltersType>({
    radius: 25,
    minRating: 0,
    maxResults: 20,
    includeReviews: true,
    sortBy: "relevance",
  });

  const apiClient = useMemo(() => new ApiClient(), []);

  const analyzeRankings = useCallback(async (): Promise<void> => {
    if (!selectedBusiness || !location || !keywords) {
      alert("Please fill in all required fields");
      return;
    }

    setIsLoading(true);
    setAnalysisError(null);

    try {
      console.log("Starting ranking analysis...", {
        business: selectedBusiness.name,
        location,
        keywords,
        filters,
      });

      const data = await apiClient.analyzeRankings(
        selectedBusiness,
        location,
        keywords,
        filters
      );

      setRankingData(data);
      console.log("Analysis completed successfully", data);

      // Show success message
      const targetBusiness = data.businesses.find((b) => b.isTarget);
      if (targetBusiness) {
        console.log(
          `Your business "${targetBusiness.name}" ranks #${targetBusiness.rank}`
        );
      }
    } catch (error) {
      console.error("Analysis failed:", error);
      const errorMessage =
        error instanceof Error ? error.message : "Analysis failed";
      setAnalysisError(errorMessage);

      // Show user-friendly error message
      if (errorMessage.includes("quota") || errorMessage.includes("limit")) {
        alert("API limit reached. Please try again in a few minutes.");
      } else if (errorMessage.includes("not found")) {
        alert("No businesses found. Try different keywords or location.");
      } else {
        alert(
          "Analysis failed. Please check your internet connection and try again."
        );
      }
    } finally {
      setIsLoading(false);
    }
  }, [selectedBusiness, location, keywords, filters, apiClient]);

  const targetBusiness = rankingData?.businesses.find((b) => b.isTarget);
  const competitors = rankingData?.businesses.filter((b) => !b.isTarget) || [];

  const handleExport = useCallback((format: string): void => {
    console.log(`Exported as ${format}`);
    // Export functionality would be implemented here
  }, []);

  const handleRetryAnalysis = useCallback(() => {
    setAnalysisError(null);
    analyzeRankings();
  }, [analyzeRankings]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Left Sidebar - Search and Controls */}
            <div className="lg:col-span-1 space-y-6">
              {/* Business Search */}
              <ErrorBoundary
                fallback={({ error, retry }) => (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4 text-zinc-900">
                      Business Search
                    </h2>
                    <DataErrorFallback error={error} retry={retry} />
                  </div>
                )}
              >
                <BusinessSearch
                  selectedBusiness={selectedBusiness}
                  onBusinessSelect={setSelectedBusiness}
                  location={location}
                  onLocationChange={setLocation}
                  keywords={keywords}
                  onKeywordsChange={setKeywords}
                  onAnalyze={analyzeRankings}
                  isLoading={isLoading}
                />
              </ErrorBoundary>

              {/* Target Business Details */}
              {targetBusiness && (
                <ErrorBoundary fallback={DataErrorFallback}>
                  <div className="bg-white text-zinc-900 rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold mb-4">
                      Your Business Performance
                    </h2>
                    <div className="space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Business:</span>
                        <span className="font-medium">
                          {targetBusiness.name}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Current Rank:</span>
                        <span
                          className={`font-bold px-2 py-1 rounded text-sm ${
                            targetBusiness.rank! <= 3
                              ? "bg-green-100 text-green-800"
                              : targetBusiness.rank! <= 10
                              ? "bg-yellow-100 text-yellow-800"
                              : "bg-red-100 text-red-800"
                          }`}
                        >
                          #{targetBusiness.rank}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Visibility:</span>
                        <span className="font-medium">
                          {targetBusiness.visibility}%
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Competition:</span>
                        <span
                          className={`font-medium ${
                            targetBusiness.difficulty === "LOW"
                              ? "text-green-600"
                              : targetBusiness.difficulty === "MEDIUM"
                              ? "text-yellow-600"
                              : "text-red-600"
                          }`}
                        >
                          {targetBusiness.difficulty}
                        </span>
                      </div>
                      {targetBusiness.rating && (
                        <div className="flex justify-between">
                          <span className="text-gray-600">Rating:</span>
                          <div className="flex items-center space-x-1">
                            <span className="font-medium">
                              {targetBusiness.rating}
                            </span>
                            <div className="flex text-yellow-400 text-sm">
                              {"★".repeat(Math.floor(targetBusiness.rating))}
                              {"☆".repeat(
                                5 - Math.floor(targetBusiness.rating)
                              )}
                            </div>
                            <span className="text-gray-500 text-sm">
                              ({targetBusiness.reviews || 0})
                            </span>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Performance Indicator */}
                    <div className="mt-4 pt-4 border-t border-gray-200">
                      <div className="text-sm">
                        {targetBusiness.rank! <= 3 ? (
                          <div className="text-green-700 bg-green-50 p-2 rounded">
                            🎉 Excellent! You're in the top 3 results.
                          </div>
                        ) : targetBusiness.rank! <= 10 ? (
                          <div className="text-yellow-700 bg-yellow-50 p-2 rounded">
                            📈 Good position! Room for improvement to reach top
                            3.
                          </div>
                        ) : (
                          <div className="text-red-700 bg-red-50 p-2 rounded">
                            📊 Needs work. Focus on SEO to improve rankings.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </ErrorBoundary>
              )}

              {/* Search Filters */}
              <ErrorBoundary
                fallback={({ error, retry }) => (
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h3 className="font-semibold text-gray-900 mb-4">
                      Search Filters
                    </h3>
                    <DataErrorFallback error={error} retry={retry} />
                  </div>
                )}
              >
                <SearchFiltersComponent
                  filters={filters}
                  onFiltersChange={setFilters}
                />
              </ErrorBoundary>

              {/* Export Options */}
              {rankingData && (
                <ErrorBoundary fallback={DataErrorFallback}>
                  <ExportOptions data={rankingData} onExport={handleExport} />
                </ErrorBoundary>
              )}
            </div>

            {/* Main Content - Map and Results */}
            <div className="lg:col-span-3 space-y-6">
              {/* Analysis Error State */}
              {analysisError && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-6">
                  <div className="flex items-start">
                    <svg
                      className="w-6 h-6 text-red-600 mt-1 mr-3 flex-shrink-0"
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
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-red-900 mb-2">
                        Analysis Failed
                      </h3>
                      <p className="text-red-700 mb-4">{analysisError}</p>
                      <div className="flex space-x-3">
                        <button
                          onClick={handleRetryAnalysis}
                          disabled={isLoading}
                          className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 transition-colors"
                        >
                          {isLoading ? "Retrying..." : "Retry Analysis"}
                        </button>
                        <button
                          onClick={() => setAnalysisError(null)}
                          className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 transition-colors"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {rankingData && !analysisError && (
                <>
                  {/* Position Map */}
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <h2 className="text-lg font-semibold text-zinc-900 mb-4 flex items-center">
                      <svg
                        className="w-5 h-5 mr-2"
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
                      Position Map
                      <span className="ml-2 text-sm font-normal text-gray-600">
                        ({rankingData.businesses.length} businesses found)
                      </span>
                    </h2>
                    <RankingMap data={rankingData} />
                  </div>

                  {/* Competitors Analysis */}
                  <ErrorBoundary fallback={DataErrorFallback}>
                    <CompetitorsList
                      competitors={competitors}
                      targetBusiness={targetBusiness}
                    />
                  </ErrorBoundary>
                </>
              )}

              {/* Loading State */}
              {isLoading && (
                <div className="space-y-6">
                  <div className="bg-white rounded-lg shadow-sm p-6">
                    <div className="flex items-center justify-center py-12">
                      <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                        <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                          Analyzing Rankings...
                        </h2>
                        <p className="text-gray-600 mb-4">
                          Searching for businesses and calculating rankings
                        </p>
                        <div className="text-sm text-gray-500">
                          <p>• Searching Google Places for "{keywords}"</p>
                          <p>• Analyzing competitor positions</p>
                          <p>• Calculating visibility metrics</p>
                        </div>
                      </div>
                    </div>
                  </div>
                  <DataLoadingSkeleton
                    title="Preparing competitor analysis..."
                    rows={6}
                  />
                </div>
              )}

              {/* Empty State */}
              {!rankingData && !isLoading && !analysisError && (
                <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                  <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <svg
                      className="w-8 h-8 text-blue-600"
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
                  </div>
                  <h2 className="text-xl font-semibold text-zinc-900 mb-4">
                    Ready to Analyze Your Rankings
                  </h2>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    Select your business, enter your target location and
                    keywords, then click "Analyze Rankings" to see how you
                    compare to competitors.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto text-sm">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900 mb-1">
                        1. Find Your Business
                      </div>
                      <div className="text-gray-600">
                        Search and select your business from Google Places
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900 mb-1">
                        2. Set Location & Keywords
                      </div>
                      <div className="text-gray-600">
                        Enter your target area and search terms
                      </div>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <div className="font-medium text-gray-900 mb-1">
                        3. Analyze Results
                      </div>
                      <div className="text-gray-600">
                        See your ranking position and competitors
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default HomePage;
