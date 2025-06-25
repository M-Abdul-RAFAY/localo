import { NextRequest, NextResponse } from "next/server";
import { Business, ApiResponse } from "@/types";

interface SearchBusinessesRequest {
  query: string;
  location: string;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body: SearchBusinessesRequest = await request.json();
    const { query, location } = body;

    if (!query || !location) {
      return NextResponse.json<ApiResponse<never>>(
        { success: false, error: "Query and location are required" },
        { status: 400 }
      );
    }

    // Mock Google Places API response
    const businesses: Business[] = [
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
    ];

    return NextResponse.json<ApiResponse<{ businesses: Business[] }>>({
      success: true,
      data: { businesses },
    });
  } catch (error) {
    console.error("Business search error:", error);
    return NextResponse.json<ApiResponse<never>>(
      { success: false, error: "Failed to search businesses" },
      { status: 500 }
    );
  }
}
