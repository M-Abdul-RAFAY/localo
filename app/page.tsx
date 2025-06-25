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

// Dynamically import map component to avoid SSR issues
const RankingMap = dynamic(() => import("./components/RankingMap"), {
  ssr: false,
  loading: () => (
    <div className="w-full h-96 bg-gray-200 animate-pulse rounded-lg" />
  ),
});

const HomePage: React.FC = () => {
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(
    null
  );
  const [location, setLocation] = useState<string>("");
  const [keywords, setKeywords] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [rankingData, setRankingData] = useState<RankingData | null>(null);
  const [filters, setFilters] = useState<SearchFiltersType>({
    radius: 25,
    minRating: 0,
    maxResults: 20,
    includeReviews: true,
    sortBy: "relevance",
  });

  // Move this import to the top of the file
  // import { useMemo } from "react";

  const mockRankingData: RankingData = useMemo(
    () => ({
      center: { lat: 34.0522, lng: -118.2437 },
      timestamp: new Date().toISOString(),
      businesses: [
        {
          id: 1,
          name: "Eternity Private Security",
          rank: 1,
          lat: 34.0522,
          lng: -118.2437,
          visibility: 67,
          difficulty: "LOW",
          isTarget: true,
          rating: 4.8,
          reviews: 127,
          address: "123 Main St, Los Angeles, CA",
          placeId: "mock_place_1",
        },
        {
          id: 2,
          name: "Guardian Shield",
          rank: 2,
          lat: 34.0622,
          lng: -118.2537,
          visibility: 55,
          difficulty: "MEDIUM",
          isTarget: false,
          rating: 4.7,
          reviews: 98,
          address: "456 Elm St, Los Angeles, CA",
          placeId: "mock_place_2",
        },
        {
          id: 3,
          name: "SecureCorp",
          rank: 3,
          lat: 34.0722,
          lng: -118.2637,
          visibility: 48,
          difficulty: "MEDIUM",
          isTarget: false,
          rating: 4.6,
          reviews: 75,
          address: "789 Oak St, Los Angeles, CA",
          placeId: "mock_place_3",
        },
        {
          id: 4,
          name: "Shield & Protect",
          rank: 4,
          lat: 34.0422,
          lng: -118.2337,
          visibility: 72,
          difficulty: "LOW",
          isTarget: false,
          rating: 4.9,
          reviews: 110,
          address: "321 Pine St, Los Angeles, CA",
          placeId: "mock_place_4",
        },
        {
          id: 5,
          name: "Defense Alliance",
          rank: 5,
          lat: 34.0222,
          lng: -118.2137,
          visibility: 60,
          difficulty: "HIGH",
          isTarget: false,
          rating: 4.3,
          reviews: 85,
          address: "654 Maple St, Los Angeles, CA",
          placeId: "mock_place_5",
        },
        {
          id: 6,
          name: "Valley Protection Services",
          rank: 10,
          lat: 34.0822,
          lng: -118.2737,
          visibility: 18,
          difficulty: "HIGH",
          isTarget: false,
          rating: 4.1,
          reviews: 92,
          address: "987 Cedar Blvd, Los Angeles, CA",
          placeId: "mock_place_6",
        },
      ],
    }),
    []
  );

  const analyzeRankings = useCallback(async (): Promise<void> => {
    if (!selectedBusiness || !location || !keywords) {
      alert("Please fill in all required fields");
      return;
    }
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000));
      let filteredBusinesses = mockRankingData.businesses.filter(
        (business: Business) => {
          if (
            filters.minRating > 0 &&
            (business.rating || 0) < filters.minRating
          )
            return false;
          return true;
        }
      );
      if (filters.maxResults < filteredBusinesses.length) {
        filteredBusinesses = filteredBusinesses.slice(0, filters.maxResults);
      }
      setRankingData({
        ...mockRankingData,
        businesses: filteredBusinesses,
      });
    } catch (error) {
      console.error("Error analyzing rankings:", error);
      alert("Failed to analyze rankings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, [selectedBusiness, location, keywords, filters, mockRankingData]);

  const targetBusiness = rankingData?.businesses.find((b) => b.isTarget);
  const competitors = rankingData?.businesses.filter((b) => !b.isTarget) || [];

  const handleExport = useCallback((format: string): void => {
    console.log(`Exported as ${format}`);
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Left Sidebar - Search and Controls */}
          <div className="lg:col-span-1 space-y-6">
            {/* Business Search */}
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
            {/* Target Business Details */}
            {targetBusiness && (
              <div className="bg-white text-zinc-900 rounded-lg shadow-sm p-6">
                <h2 className="text-lg font-semibold mb-4">
                  Target Business Details
                </h2>
                <p>
                  <strong>Name:</strong> {targetBusiness.name}
                </p>
                <p>
                  <strong>Rank:</strong> {targetBusiness.rank}
                </p>
                <p>
                  <strong>Visibility:</strong> {targetBusiness.visibility}%
                </p>
                <p>
                  <strong>Difficulty:</strong> {targetBusiness.difficulty}
                </p>
                <p>
                  <strong>Rating:</strong> {targetBusiness.rating} (
                  {targetBusiness.reviews} reviews)
                </p>
                <p>
                  <strong>Address:</strong> {targetBusiness.address}
                </p>
              </div>
            )}
            {/* Search Filters */}
            <SearchFiltersComponent
              filters={filters}
              onFiltersChange={setFilters}
            />
            {/* Export Options */}
            {rankingData && (
              <ExportOptions data={rankingData} onExport={handleExport} />
            )}
          </div>
          {/* Main Content - Map and Results */}
          <div className="lg:col-span-3 space-y-6">
            {rankingData && (
              <>
                {/* Position Map */}
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <h2 className="text-lg font-semibold text-zinc-900 mb-4">
                    Position Map
                  </h2>
                  <RankingMap data={rankingData} />
                </div>
                {/* Competitors Analysis */}
                <CompetitorsList
                  competitors={competitors}
                  targetBusiness={targetBusiness}
                />
              </>
            )}
            {/* Empty State */}
            {!rankingData && !isLoading && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <h2 className="text-xl font-semibold text-zinc-900 mb-4">
                  No Data Available
                </h2>
                <p className="text-gray-500">
                  Please perform a search to see the results.
                </p>
              </div>
            )}
            {/* Loading State */}
            {isLoading && (
              <div className="bg-white rounded-lg shadow-sm p-12 text-center">
                <h2 className="text-xl font-semibold mb-4">Loading...</h2>
                <p className="text-gray-500">
                  Your results are being prepared.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
