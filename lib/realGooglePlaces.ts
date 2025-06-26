// lib/realGooglePlaces.ts
import { Business } from "@/types";
import { GeocodingService, GeocodeResult } from "./geocodingService";

export interface GooglePlacesConfig {
  apiKey: string;
}

export class RealGooglePlacesService {
  private service: google.maps.places.PlacesService | null = null;
  private geocodingService: GeocodingService;
  private apiKey: string;

  constructor(config: GooglePlacesConfig) {
    this.apiKey = config.apiKey;
    this.geocodingService = new GeocodingService(config.apiKey);
  }

  init(): void {
    if (typeof window !== "undefined" && window.google) {
      // Create a dummy div for the PlacesService
      const dummyDiv = document.createElement("div");
      this.service = new window.google.maps.places.PlacesService(dummyDiv);
    }
  }

  async searchBusinesses(
    query: string,
    location: string,
    radius: number = 25000
  ): Promise<Business[]> {
    if (!this.service) {
      this.init();
    }

    if (!this.service) {
      throw new Error("Google Places service not initialized");
    }

    try {
      console.log(`Starting business search for: "${query}" in "${location}"`);

      // First, geocode the location with improved fallback
      const center = await this.geocodingService.geocodeLocation(location);
      console.log("Geocoding result:", center);

      // Then search for businesses
      const places = await this.performTextSearch(query, center, radius);
      console.log(`Found ${places.length} businesses from Places API`);

      // Convert to our Business interface
      const businesses = places.map((place, index) => ({
        id: place.place_id || `place_${index}`,
        name: place.name || "Unknown Business",
        address: place.formatted_address || place.vicinity || "",
        placeId: place.place_id || "",
        rating: place.rating,
        reviews: place.user_ratings_total,
        lat: place.geometry?.location?.lat(),
        lng: place.geometry?.location?.lng(),
        rank: index + 1,
        isTarget: false, // This will be determined later
      }));

      console.log("Converted businesses:", businesses.length);
      return businesses;
    } catch (error) {
      console.error("Google Places search failed:", error);
      throw error;
    }
  }

  async getPlaceDetails(
    placeId: string
  ): Promise<google.maps.places.PlaceResult> {
    if (!this.service) {
      this.init();
    }

    if (!this.service) {
      throw new Error("Google Places service not initialized");
    }

    return new Promise((resolve, reject) => {
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeId,
        fields: [
          "name",
          "formatted_address",
          "geometry",
          "rating",
          "user_ratings_total",
          "reviews",
          "photos",
          "website",
          "formatted_phone_number",
          "opening_hours",
        ],
      };

      this.service!.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    });
  }

  private async performTextSearch(
    query: string,
    location: GeocodeResult,
    radius: number
  ): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
      if (!this.service) {
        reject(new Error("Places service not initialized"));
        return;
      }

      const center = new google.maps.LatLng(location.lat, location.lng);

      const request: google.maps.places.TextSearchRequest = {
        query: query,
        location: center,
        radius: radius,
        type: "establishment",
      };

      console.log("Performing text search with request:", {
        query,
        location: { lat: location.lat, lng: location.lng },
        radius,
      });

      this.service.textSearch(request, (results, status) => {
        console.log("Text search completed with status:", status);
        console.log("Results count:", results?.length || 0);

        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else if (
          status === google.maps.places.PlacesServiceStatus.ZERO_RESULTS
        ) {
          console.log("Zero results returned for search");
          resolve([]); // Return empty array for no results
        } else {
          const errorMsg = `Places search failed: ${status}`;
          console.error(errorMsg);
          reject(new Error(errorMsg));
        }
      });
    });
  }

  // Method to find a specific business in the results
  async findTargetBusiness(
    businesses: Business[],
    targetName: string,
    targetAddress?: string
  ): Promise<Business | null> {
    const normalizedTargetName = targetName.toLowerCase().trim();

    console.log(`Looking for target business: "${normalizedTargetName}"`);

    // First, try exact name match
    let match = businesses.find(
      (business) => business.name.toLowerCase().trim() === normalizedTargetName
    );

    if (match) {
      console.log("Found exact name match:", match.name);
      return match;
    }

    // Then try partial name match
    match = businesses.find(
      (business) =>
        business.name.toLowerCase().includes(normalizedTargetName) ||
        normalizedTargetName.includes(business.name.toLowerCase())
    );

    if (match) {
      console.log("Found partial name match:", match.name);
      return match;
    }

    // If we have an address, try to match by address similarity
    if (targetAddress) {
      const normalizedTargetAddress = targetAddress.toLowerCase();
      match = businesses.find((business) => {
        const businessAddress = business.address.toLowerCase();
        return (
          businessAddress.includes(normalizedTargetAddress) ||
          normalizedTargetAddress.includes(businessAddress)
        );
      });

      if (match) {
        console.log("Found address match:", match.name);
        return match;
      }
    }

    console.log("No target business match found");
    return null;
  }

  // Calculate ranking metrics
  calculateRankingMetrics(
    businesses: Business[],
    targetBusiness: Business
  ): Business[] {
    return businesses.map((business, index) => {
      const isTarget = this.isTargetBusiness(business, targetBusiness);

      return {
        ...business,
        rank: index + 1,
        isTarget,
        visibility: this.calculateVisibility(index, businesses.length),
        difficulty: this.calculateDifficulty(index),
      };
    });
  }

  private isTargetBusiness(business: Business, target: Business): boolean {
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
    if (
      businessName.includes(targetName) ||
      targetName.includes(businessName)
    ) {
      // Additional check: ensure significant overlap
      const similarity = this.calculateNameSimilarity(businessName, targetName);
      return similarity > 0.7; // 70% similarity threshold
    }

    return false;
  }

  private calculateNameSimilarity(name1: string, name2: string): number {
    const longer = name1.length > name2.length ? name1 : name2;
    const shorter = name1.length > name2.length ? name2 : name1;

    if (longer.length === 0) return 1.0;

    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];

    // Initialize the matrix
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }

    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }

    // Fill in the matrix
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1, // substitution
            matrix[i][j - 1] + 1, // insertion
            matrix[i - 1][j] + 1 // deletion
          );
        }
      }
    }

    return matrix[str2.length][str1.length];
  }

  private calculateVisibility(rank: number, totalResults: number): number {
    // Visibility decreases exponentially with rank
    const baseVisibility = 100;
    const decayRate = 0.15;
    const visibility = baseVisibility * Math.exp(-decayRate * rank);
    return Math.max(5, Math.min(100, Math.round(visibility)));
  }

  private calculateDifficulty(rank: number): "LOW" | "MEDIUM" | "HIGH" {
    if (rank <= 3) return "LOW";
    if (rank <= 10) return "MEDIUM";
    return "HIGH";
  }

  // Helper method to get location suggestions
  getLocationSuggestions(input: string): string[] {
    return this.geocodingService.suggestLocation(input);
  }

  // Validate if the service is ready
  isReady(): boolean {
    return (
      this.service !== null && typeof window !== "undefined" && !!window.google
    );
  }

  // Generate mock data as fallback (for development/testing)
  generateMockBusinesses(
    query: string,
    location: GeocodeResult,
    count: number = 10
  ): Business[] {
    console.log("Generating mock businesses as fallback");

    const businessTypes = this.getBusinessTypes(query);
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

    for (let i = 0; i < count; i++) {
      const type =
        businessTypes[Math.floor(Math.random() * businessTypes.length)];
      const adjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];

      // Generate coordinates near the center location
      const latOffset = (Math.random() - 0.5) * 0.1; // ~5.5km radius
      const lngOffset = (Math.random() - 0.5) * 0.1;

      businesses.push({
        id: `mock_${i + 1}`,
        name: `${adjective} ${type} ${suffix}`,
        address: `${123 + i * 10} ${
          ["Main St", "Oak Ave", "Pine Rd", "Elm Blvd", "Maple Dr"][i % 5]
        }, ${location.formatted_address?.split(",")[0] || "City"}, ${
          location.formatted_address?.split(",")[1]?.trim() || "State"
        }`,
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

  private getBusinessTypes(keywords: string): string[] {
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

    if (keywordLower.includes("lawyer") || keywordLower.includes("attorney")) {
      return [
        "Law Firm",
        "Attorney",
        "Legal Services",
        "Lawyer",
        "Legal Counsel",
        "Law Office",
      ];
    }

    if (keywordLower.includes("dentist") || keywordLower.includes("dental")) {
      return [
        "Dental Office",
        "Dentist",
        "Dental Care",
        "Orthodontics",
        "Dental Clinic",
        "Family Dentistry",
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
}
