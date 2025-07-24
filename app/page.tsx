"use client";

import { useState, useCallback, useMemo } from "react";
import dynamic from "next/dynamic";
import {
  Business,
  SearchFilters as SearchFiltersType,
  RankingData,
} from "@/types";
import BusinessSearch from "./components/BusinessSearch";
import GridCompetitorsList from "./components/GridCompetitorsList";
import { ErrorBoundary, DataErrorFallback } from "./components/ErrorBoundary";
import { DataLoadingSkeleton } from "./components/LoadingSkeletons";

// Dynamically import map component to avoid SSR issues
const GridRankingMap = dynamic(
  () => import("./components/GridCompetitorsList"),
  {
    ssr: false,
    loading: () => (
      <div className="bg-white rounded-lg shadow-sm p-6 h-full">
        <div className="h-6 w-32 bg-gray-200 animate-pulse rounded mb-4"></div>
        <div className="w-full h-[600px] bg-gray-200 animate-pulse rounded-lg" />
      </div>
    ),
  }
);

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
    keywords: string[],
    maxCompetitors: number
  ): Promise<RankingData> {
    try {
      console.log("Making API request with keywords:", keywords);

      const response = await fetch("/api/analyze-rankings", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          business,
          location,
          keywords: keywords.join(", "), // For now, join keywords
          filters: {
            radius: 25,
            minRating: 0,
            maxResults: maxCompetitors,
            includeReviews: true,
            sortBy: "relevance",
          },
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
  const [keywords, setKeywords] = useState<string[]>([]);
  const [maxCompetitors, setMaxCompetitors] = useState<number>(20);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [selectedKeyword, setSelectedKeyword] = useState<string>("");

  const apiClient = useMemo(() => new ApiClient(), []);

  const analyzeRankings = useCallback(async (): Promise<void> => {
    if (!selectedBusiness || !location || keywords.length === 0) {
      alert("Please fill in all required fields and add at least one keyword");
      return;
    }

    setIsLoading(true);
    setAnalysisError(null);

    try {
      console.log("Starting ranking analysis...", {
        business: selectedBusiness.name,
        location,
        keywords,
        maxCompetitors,
      });

      const data = await apiClient.analyzeRankings(
        selectedBusiness,
        location,
        keywords,
        maxCompetitors
      );

      console.log(
        "Analysis completed successfully. Setting ranking data:",
        data
      );
      setRankingData(data);

      // Set first keyword as selected by default
      if (keywords.length > 0 && !selectedKeyword) {
        setSelectedKeyword(keywords[0]);
      }

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
  }, [
    selectedBusiness,
    location,
    keywords,
    maxCompetitors,
    apiClient,
    selectedKeyword,
  ]);

  const targetBusiness = rankingData?.businesses.find((b) => b.isTarget);
  const competitors = rankingData?.businesses.filter((b) => !b.isTarget) || [];

  const handleRetryAnalysis = useCallback(() => {
    setAnalysisError(null);
    analyzeRankings();
  }, [analyzeRankings]);

  return (
    <ErrorBoundary>
      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto px-4 py-6">
          {/* Top Section - Business Search */}
          <div className="mb-6">
            <ErrorBoundary
              fallback={({ error, retry }) => (
                <div className="bg-white rounded-lg shadow-sm p-6">
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
                maxCompetitors={maxCompetitors}
                onMaxCompetitorsChange={setMaxCompetitors}
                onAnalyze={analyzeRankings}
                isLoading={isLoading}
              />
            </ErrorBoundary>
          </div>

          {/* Analysis Error State */}
          {analysisError && (
            <div className="mb-6">
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
            </div>
          )}

          {/* Main Content - Side by Side Layout */}
          {rankingData && !analysisError && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              {/* Left Side - Competitors List */}
              <div className="order-2 xl:order-1">
                <ErrorBoundary fallback={DataErrorFallback}>
                  <GridCompetitorsList
                    competitors={competitors}
                    targetBusiness={targetBusiness}
                    keywords={keywords}
                    selectedKeyword={selectedKeyword}
                    onKeywordSelect={setSelectedKeyword}
                  />
                </ErrorBoundary>
              </div>

              {/* Right Side - Grid Map */}
              <div className="order-1 xl:order-2">
                <div className="bg-white rounded-lg shadow-sm p-6 h-full">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-lg font-semibold text-zinc-900">
                      Position Map
                    </h2>
                    <button
                      className="text-sm text-blue-600 hover:text-blue-700 flex items-center"
                      onClick={() =>
                        window.open(
                          "https://example.com/how-to-understand-position-map",
                          "_blank"
                        )
                      }
                    >
                      How to understand Position Map?
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
                          d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
                        />
                      </svg>
                    </button>
                  </div>

                  <ErrorBoundary
                    fallback={({ error, retry }) => (
                      <div className="w-full h-[600px] bg-yellow-50 rounded-lg border border-yellow-200 flex items-center justify-center">
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
                            Map Error
                          </h3>
                          <p className="text-xs text-yellow-700 mb-3">
                            Failed to load map component
                          </p>
                          <button
                            onClick={retry}
                            className="px-3 py-1 text-xs bg-yellow-600 text-white rounded hover:bg-yellow-700 transition-colors"
                          >
                            Retry
                          </button>
                        </div>
                      </div>
                    )}
                  >
                    <GridRankingMap
                      data={rankingData}
                      selectedKeyword={selectedKeyword}
                    />
                  </ErrorBoundary>
                </div>
              </div>
            </div>
          )}

          {/* Loading State */}
          {isLoading && (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="order-2 xl:order-1">
                <DataLoadingSkeleton
                  title="Analyzing competitors..."
                  rows={10}
                />
              </div>
              <div className="order-1 xl:order-2">
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex items-center justify-center h-[600px]">
                    <div className="text-center">
                      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                      <h2 className="text-xl font-semibold text-zinc-900 mb-2">
                        Analyzing Rankings...
                      </h2>
                      <p className="text-gray-600 mb-4">
                        Searching for businesses across the grid
                      </p>
                      <div className="text-sm text-gray-500">
                        <p>
                          • Processing {keywords.length} keyword
                          {keywords.length > 1 ? "s" : ""}
                        </p>
                        <p>• Analyzing up to {maxCompetitors} competitors</p>
                        <p>• Generating grid-based ranking map</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
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
                    d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"
                  />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-zinc-900 mb-4">
                Ready to Analyze Your Local Rankings
              </h2>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Select your business, add keywords, set your location, and click
                "Analyze Rankings" to see how you rank across different areas.
              </p>
            </div>
          )}
        </div>
      </div>
    </ErrorBoundary>
  );
};

export default HomePage;
