import { NextRequest, NextResponse } from "next/server";
import { Business, SearchFilters, RankingData, ApiResponse } from "@/types";

interface AnalyzeRankingsRequest {
  business: Business;
  location: string;
  keywords: string;
  filters?: SearchFilters;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: AnalyzeRankingsRequest = await request.json();
    const { business, location, keywords, filters } = body;

    if (!business || !location || !keywords) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Business, location, and keywords are required",
        },
        { status: 400 }
      );
    }

    // Simulate ranking analysis
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const mockRankingData: RankingData = {
      center: { lat: 34.0522, lng: -118.2437 },
      timestamp: new Date().toISOString(),
      businesses: [
        {
          id: 1,
          name: business.name,
          rank: 1,
          lat: 34.0522,
          lng: -118.2437,
          visibility: 67,
          difficulty: "LOW",
          isTarget: true,
          rating: 4.8,
          reviews: 127,
          address: business.address,
          placeId: business.placeId,
        },
        {
          id: 2,
          name: "Apex Security Services",
          rank: 2,
          lat: 34.0622,
          lng: -118.2537,
          visibility: 45,
          difficulty: "MEDIUM",
          isTarget: false,
          rating: 5.0,
          reviews: 89,
          address: "456 Oak Ave, Los Angeles, CA",
          placeId: "mock_place_2",
        },
        {
          id: 3,
          name: "Guardian Security Pro",
          rank: 3,
          lat: 34.0422,
          lng: -118.2337,
          visibility: 38,
          difficulty: "HIGH",
          isTarget: false,
          rating: 4.5,
          reviews: 156,
          address: "789 Pine St, Los Angeles, CA",
          placeId: "mock_place_3",
        },
        {
          id: 4,
          name: "SecureGuard Elite",
          rank: 4,
          lat: 34.0722,
          lng: -118.2637,
          visibility: 32,
          difficulty: "MEDIUM",
          isTarget: false,
          rating: 4.2,
          reviews: 203,
          address: "321 Elm St, Los Angeles, CA",
          placeId: "mock_place_4",
        },
        {
          id: 5,
          name: "Metro Security Solutions",
          rank: 9,
          lat: 34.0322,
          lng: -118.2137,
          visibility: 22,
          difficulty: "LOW",
          isTarget: false,
          rating: 4.6,
          reviews: 74,
          address: "654 Maple Ave, Los Angeles, CA",
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
    };

    // Apply filters if provided
    if (filters) {
      let filteredBusinesses = mockRankingData.businesses;
      if (filters.minRating > 0) {
        filteredBusinesses = filteredBusinesses.filter(
          (b) => (b.rating || 0) >= filters.minRating
        );
      }
      if (
        filters.maxResults &&
        filters.maxResults < filteredBusinesses.length
      ) {
        filteredBusinesses = filteredBusinesses.slice(0, filters.maxResults);
      }
      mockRankingData.businesses = filteredBusinesses;
    }

    return NextResponse.json<ApiResponse<RankingData>>({
      success: true,
      data: mockRankingData,
    });
  } catch (error) {
    console.error("Ranking analysis error:", error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to analyze rankings" },
      { status: 500 }
    );
  }
}
