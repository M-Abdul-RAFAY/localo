import { NextRequest, NextResponse } from "next/server";
import { Business, SearchFilters, RankingData, ApiResponse } from "@/types";
import { GeocodingService } from "@/lib/geocodingService";

interface AnalyzeRankingsRequest {
  business: Business;
  location: string;
  keywords: string;
  filters?: SearchFilters;
}

// Rate limiting store (in production, use Redis or similar)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(identifier: string): boolean {
  const now = Date.now();
  const windowMs = 60 * 1000; // 1 minute
  const limit = 10; // 10 requests per minute

  const current = rateLimitStore.get(identifier);

  if (!current || now > current.resetTime) {
    rateLimitStore.set(identifier, { count: 1, resetTime: now + windowMs });
    return true;
  }

  if (current.count >= limit) {
    return false;
  }

  current.count++;
  return true;
}

async function searchBusinesses(
  keywords: string,
  location: { lat: number; lng: number },
  radius: number = 25000
): Promise<Business[]> {
  try {
    const apiKey = process.env.GOOGLE_PLACES_API_KEY;
    if (!apiKey) {
      console.warn("Google Places API key not configured, using mock data");
      return generateMockBusinesses(keywords, location);
    }

    console.log(
      `Searching Places API: "${keywords}" at ${location.lat},${location.lng} within ${radius}m`
    );

    // Use Google Places Text Search API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${encodeURIComponent(
        keywords
      )}&location=${location.lat},${
        location.lng
      }&radius=${radius}&key=${apiKey}`,
      {
        method: "GET",
        headers: {
          Accept: "application/json",
        },
      }
    );

    if (!response.ok) {
      console.error(
        `Places API HTTP error: ${response.status} ${response.statusText}`
      );
      throw new Error(`Places API error: ${response.status}`);
    }

    const data = await response.json();
    console.log(`Places API response status: ${data.status}`);

    if (data.status === "REQUEST_DENIED") {
      console.error("Places API request denied:", data.error_message);
      throw new Error(
        `API access denied: ${
          data.error_message || "Check your API key and billing"
        }`
      );
    }

    if (data.status === "OVER_QUERY_LIMIT") {
      console.error("Places API quota exceeded");
      throw new Error("API quota exceeded. Please try again later.");
    }

    if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
      console.error("Places API error:", data.status, data.error_message);
      throw new Error(
        `Places search failed: ${data.status} - ${
          data.error_message || "Unknown error"
        }`
      );
    }

    if (!data.results || data.results.length === 0) {
      console.log("No results from Places API, generating mock data");
      return generateMockBusinesses(keywords, location);
    }

    console.log(`Found ${data.results.length} businesses from Places API`);

    // Convert Google Places results to our Business interface
    return data.results.map((place: any, index: number) => ({
      id: place.place_id || `place_${index}`,
      name: place.name || "Unknown Business",
      address: place.formatted_address || place.vicinity || "",
      placeId: place.place_id || "",
      rating: place.rating,
      reviews: place.user_ratings_total,
      lat: place.geometry?.location?.lat,
      lng: place.geometry?.location?.lng,
      rank: index + 1,
      isTarget: false, // Will be determined later
    }));
  } catch (error) {
    console.error("Places search error:", error);
    console.log("Falling back to mock data generation");
    return generateMockBusinesses(keywords, location);
  }
}

function generateMockBusinesses(
  keywords: string,
  location: { lat: number; lng: number }
): Business[] {
  console.log("Generating mock businesses for fallback");

  const businessTypes = getBusinessTypes(keywords);
  const businesses: Business[] = [];
  const adjectives = [
    "Elite",
    "Prime",
    "Professional",
    "Advanced",
    "Premium",
    "Expert",
    "Superior",
    "Quality",
    "Trusted",
    "Reliable",
    "Local",
    "Best",
  ];
  const suffixes = [
    "Inc",
    "LLC",
    "Services",
    "Solutions",
    "Group",
    "Agency",
    "Company",
    "Corp",
    "Enterprises",
    "Associates",
  ];

  for (let i = 0; i < 15; i++) {
    const type =
      businessTypes[Math.floor(Math.random() * businessTypes.length)];
    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

    // Generate coordinates near the center location
    const latOffset = (Math.random() - 0.5) * 0.1; // ~5.5km radius
    const lngOffset = (Math.random() - 0.5) * 0.1;

    businesses.push({
      id: `mock_${i + 1}`,
      name: `${adjective} ${type} ${suffix}`,
      address: `${123 + i * 10} ${
        ["Main St", "Oak Ave", "Pine Rd", "Elm Blvd", "Maple Dr"][i % 5]
      }, City, State`,
      rating: parseFloat((3.5 + Math.random() * 1.5).toFixed(1)),
      reviews: Math.floor(20 + Math.random() * 200),
      placeId: `mock_place_${i + 1}`,
      lat: location.lat + latOffset,
      lng: location.lng + lngOffset,
      rank: i + 1,
      isTarget: false,
    });
  }

  return businesses;
}

function getBusinessTypes(keywords: string): string[] {
  const keywordLower = keywords.toLowerCase();

  if (keywordLower.includes("security")) {
    return [
      "Security Guard Service",
      "Private Security",
      "Security Agency",
      "Security Solutions",
      "Protection Services",
      "Guard Services",
      "Security Company",
      "Safety Services",
    ];
  }

  if (keywordLower.includes("restaurant") || keywordLower.includes("food")) {
    return [
      "Restaurant",
      "Diner",
      "Bistro",
      "Cafe",
      "Eatery",
      "Grill",
      "Kitchen",
      "Cuisine",
    ];
  }

  if (keywordLower.includes("plumber") || keywordLower.includes("plumbing")) {
    return [
      "Plumbing Service",
      "Plumber",
      "Plumbing Solutions",
      "Pipe Repair",
      "Drain Cleaning",
      "Water Heater Service",
    ];
  }

  // Generic business types
  return [
    "Business Service",
    "Professional Service",
    "Company",
    "Agency",
    "Solutions Provider",
    "Service Group",
    "Consulting",
    "Enterprise",
  ];
}

function calculateRankingMetrics(
  businesses: Business[],
  targetBusiness: Business
): Business[] {
  return businesses.map((business, index) => {
    const rank = index + 1;
    const isTarget = isTargetBusiness(business, targetBusiness);

    return {
      ...business,
      rank,
      isTarget,
      visibility: calculateVisibility(rank, businesses.length),
      difficulty: calculateDifficulty(rank),
    };
  });
}

function isTargetBusiness(business: Business, target: Business): boolean {
  // Check by place ID first (most reliable)
  if (
    business.placeId &&
    target.placeId &&
    business.placeId === target.placeId
  ) {
    return true;
  }

  // Check by name similarity
  const businessName = business.name.toLowerCase().trim();
  const targetName = target.name.toLowerCase().trim();

  if (businessName === targetName) {
    return true;
  }

  // Check if names are very similar (contains each other)
  if (businessName.includes(targetName) || targetName.includes(businessName)) {
    return true;
  }

  return false;
}

function calculateVisibility(rank: number, totalResults: number): number {
  // Visibility decreases exponentially with rank
  const baseVisibility = 100;
  const decayRate = 0.15;
  const visibility = baseVisibility * Math.exp(-decayRate * rank);
  return Math.max(5, Math.min(100, Math.round(visibility)));
}

function calculateDifficulty(rank: number): "LOW" | "MEDIUM" | "HIGH" {
  if (rank <= 3) return "LOW";
  if (rank <= 10) return "MEDIUM";
  return "HIGH";
}

function applyFilters(
  businesses: Business[],
  filters: SearchFilters
): Business[] {
  let filtered = [...businesses];

  // Apply minimum rating filter
  if (filters.minRating > 0) {
    filtered = filtered.filter((b) => (b.rating || 0) >= filters.minRating);
  }

  // Apply sorting
  filtered.sort((a, b) => {
    switch (filters.sortBy) {
      case "rating":
        return (b.rating || 0) - (a.rating || 0);
      case "reviews":
        return (b.reviews || 0) - (a.reviews || 0);
      case "distance":
        // For distance sorting, we'd need to calculate distance from center
        // For now, maintain ranking order
        return (a.rank || 0) - (b.rank || 0);
      default: // relevance
        return (a.rank || 0) - (b.rank || 0);
    }
  });

  // Apply max results limit
  if (filters.maxResults && filters.maxResults < filtered.length) {
    filtered = filtered.slice(0, filters.maxResults);
  }

  return filtered;
}

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    // Get client IP for rate limiting
    const clientIP =
      request.ip ||
      request.headers.get("x-forwarded-for")?.split(",")[0] ||
      request.headers.get("x-real-ip") ||
      "unknown";

    // Check rate limit
    if (!checkRateLimit(clientIP)) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Rate limit exceeded. Please try again later.",
        },
        { status: 429 }
      );
    }

    const body: AnalyzeRankingsRequest = await request.json();
    const { business, location, keywords, filters } = body;

    // Validate required fields
    if (!business || !location || !keywords) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Business, location, and keywords are required",
        },
        { status: 400 }
      );
    }

    // Validate business object
    if (!business.name || !business.address) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Business name and address are required",
        },
        { status: 400 }
      );
    }

    try {
      console.log(`\n=== RANKING ANALYSIS START ===`);
      console.log(`Business: ${business.name}`);
      console.log(`Location: ${location}`);
      console.log(`Keywords: ${keywords}`);

      // Step 1: Geocode the location with improved fallback
      console.log(`\n1. Geocoding location: "${location}"`);
      const apiKey =
        process.env.GOOGLE_PLACES_API_KEY ||
        process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
      if (!apiKey) {
        console.warn("No API key found, using fallback geocoding");
      }

      const geocodingService = new GeocodingService(apiKey || "");
      const center = await geocodingService.geocodeLocation(location);
      console.log(`Geocoding result:`, center);

      // Step 2: Search for businesses
      console.log(`\n2. Searching for businesses with keywords: "${keywords}"`);
      const searchResults = await searchBusinesses(
        keywords,
        center,
        filters?.radius ? filters.radius * 1000 : 25000 // Convert km to meters
      );

      if (searchResults.length === 0) {
        return NextResponse.json<ApiResponse<never>>(
          {
            success: false,
            error:
              "No businesses found for the given keywords and location. Try different search terms or a larger radius.",
          },
          { status: 404 }
        );
      }

      console.log(`Found ${searchResults.length} businesses`);

      // Step 3: Calculate ranking metrics
      console.log(`\n3. Calculating ranking metrics`);
      const rankedBusinesses = calculateRankingMetrics(searchResults, business);

      // Step 4: Apply filters if provided
      let finalBusinesses = rankedBusinesses;
      if (filters) {
        console.log(`\n4. Applying filters:`, filters);
        finalBusinesses = applyFilters(rankedBusinesses, filters);
      }

      // Step 5: Create ranking data response
      const rankingData: RankingData = {
        center,
        timestamp: new Date().toISOString(),
        businesses: finalBusinesses,
      };

      // Log results
      console.log(`\n=== ANALYSIS RESULTS ===`);
      console.log(`Total businesses found: ${finalBusinesses.length}`);
      const targetBusiness = finalBusinesses.find((b) => b.isTarget);
      if (targetBusiness) {
        console.log(
          `✅ Target business "${targetBusiness.name}" found at rank #${targetBusiness.rank}`
        );
      } else {
        console.log(
          `❌ Target business "${business.name}" not found in results`
        );
        // Try to add the target business to the results if not found
        const syntheticTarget: Business = {
          ...business,
          rank: finalBusinesses.length + 1,
          isTarget: true,
          visibility: calculateVisibility(
            finalBusinesses.length + 1,
            finalBusinesses.length + 1
          ),
          difficulty: calculateDifficulty(finalBusinesses.length + 1),
          lat: center.lat + (Math.random() - 0.5) * 0.01,
          lng: center.lng + (Math.random() - 0.5) * 0.01,
        };
        finalBusinesses.push(syntheticTarget);
        console.log(
          `📝 Added target business at rank #${syntheticTarget.rank} (not found in search results)`
        );
      }

      return NextResponse.json<ApiResponse<RankingData>>({
        success: true,
        data: rankingData,
        message: `Found ${finalBusinesses.length} businesses. ${
          targetBusiness
            ? `Your business ranks #${targetBusiness.rank}`
            : `Your business was added at rank #${finalBusinesses.length} (not found in search results)`
        }.`,
      });
    } catch (searchError) {
      console.error("Search/analysis error:", searchError);

      // Return specific error messages for different failure types
      if (searchError instanceof Error) {
        if (
          searchError.message.includes("API key") ||
          searchError.message.includes("access denied")
        ) {
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error:
                "Google Places API is not properly configured. Using mock data for demonstration.",
            },
            { status: 503 }
          );
        }

        if (
          searchError.message.includes("quota") ||
          searchError.message.includes("limit")
        ) {
          return NextResponse.json<ApiResponse<never>>(
            {
              success: false,
              error: "API quota exceeded. Please try again later.",
            },
            { status: 503 }
          );
        }
      }

      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error:
            "Failed to analyze rankings. This may be due to API limits or network issues. Please try again.",
        },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Ranking analysis error:", error);

    // Handle JSON parsing errors
    if (error instanceof SyntaxError) {
      return NextResponse.json<ApiResponse<never>>(
        {
          success: false,
          error: "Invalid request format",
        },
        { status: 400 }
      );
    }

    return NextResponse.json<ApiResponse<never>>(
      {
        success: false,
        error: "Internal server error. Please try again later.",
      },
      { status: 500 }
    );
  }
}
