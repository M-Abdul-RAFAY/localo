import { Business, RankingData, SearchFilters } from "@/types";

export interface RankingServiceConfig {
  apiKey?: string;
}

export class RankingService {
  private config: RankingServiceConfig;

  constructor(config: RankingServiceConfig = {}) {
    this.config = config;
  }

  async analyzeBusinessRankings(
    targetBusiness: Business,
    location: string,
    keywords: string,
    filters?: SearchFilters,
    radius: number = 25
  ): Promise<{ success: boolean; data?: RankingData; error?: string }> {
    try {
      const searchResults = await this.performLocalSearch(
        keywords,
        location,
        radius
      );
      const rankedBusinesses = this.calculateRankings(
        searchResults,
        targetBusiness
      );
      const mapData = this.generateMapData(rankedBusinesses, location);
      if (filters) {
        mapData.businesses = this.applyFilters(mapData.businesses, filters);
      }
      return {
        success: true,
        data: mapData,
      };
    } catch (error) {
      console.error("Ranking analysis failed:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Unknown error occurred",
      };
    }
  }

  private async performLocalSearch(
    keywords: string,
    location: string,
    radius: number
  ): Promise<Business[]> {
    await new Promise((resolve) => setTimeout(resolve, 1500));
    const businessTypes = this.getBusinessTypes(keywords);
    const businesses = this.generateMockBusinesses(businessTypes, location);
    return businesses;
  }

  private calculateRankings(
    searchResults: Business[],
    targetBusiness: Business
  ): Business[] {
    return searchResults.map((business, index) => ({
      ...business,
      rank: index + 1,
      isTarget:
        business.name.toLowerCase() === targetBusiness.name.toLowerCase(),
      visibility: Math.max(5, 100 - index * 8 - Math.random() * 10),
      difficulty: this.calculateDifficulty(index, searchResults.length),
    }));
  }

  private calculateDifficulty(
    rank: number,
    totalResults: number
  ): "LOW" | "MEDIUM" | "HIGH" {
    if (rank < 3) return "LOW";
    if (rank < 8) return "MEDIUM";
    return "HIGH";
  }

  private generateMapData(
    businesses: Business[],
    centerLocation: string
  ): RankingData {
    const baseCoords = this.geocodeLocation(centerLocation);
    return {
      center: baseCoords,
      timestamp: new Date().toISOString(),
      businesses: businesses.map((business, index) => ({
        ...business,
        lat: baseCoords.lat + (Math.random() - 0.5) * 0.1,
        lng: baseCoords.lng + (Math.random() - 0.5) * 0.1,
      })),
    };
  }

  private geocodeLocation(location: string): { lat: number; lng: number } {
    const locationMap: Record<string, { lat: number; lng: number }> = {
      "los angeles": { lat: 34.0522, lng: -118.2437 },
      "new york": { lat: 40.7128, lng: -74.006 },
      chicago: { lat: 41.8781, lng: -87.6298 },
      houston: { lat: 29.7604, lng: -95.3698 },
      phoenix: { lat: 33.4484, lng: -112.074 },
    };
    const key = location.toLowerCase();
    return locationMap[key] || { lat: 34.0522, lng: -118.2437 };
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
      ];
    }
    if (keywordLower.includes("restaurant")) {
      return ["Restaurant", "Diner", "Bistro", "Cafe", "Eatery", "Grill"];
    }
    return ["Business", "Service", "Company", "Agency", "Solutions", "Group"];
  }

  private generateMockBusinesses(
    types: string[],
    location: string
  ): Business[] {
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
    ];
    const suffixes = [
      "Inc",
      "LLC",
      "Services",
      "Solutions",
      "Group",
      "Agency",
      "Company",
    ];
    for (let i = 0; i < 20; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const adjective =
        adjectives[Math.floor(Math.random() * adjectives.length)];
      const suffix = suffixes[Math.floor(Math.random() * suffixes.length)];
      businesses.push({
        id: i + 1,
        name: `${adjective} ${type} ${suffix}`,
        address: `${123 + i} Main St, ${location}`,
        rating: parseFloat((4.0 + Math.random() * 1.0).toFixed(1)),
        reviews: Math.floor(50 + Math.random() * 200),
        placeId: `mock_place_${i + 1}`,
      });
    }
    return businesses;
  }

  private applyFilters(
    businesses: Business[],
    filters: SearchFilters
  ): Business[] {
    let filtered = [...businesses];
    if (filters.minRating > 0) {
      filtered = filtered.filter((b) => (b.rating || 0) >= filters.minRating);
    }
    if (filters.maxResults < filtered.length) {
      filtered = filtered.slice(0, filters.maxResults);
    }
    filtered.sort((a, b) => {
      switch (filters.sortBy) {
        case "rating":
          return (b.rating || 0) - (a.rating || 0);
        case "reviews":
          return (b.reviews || 0) - (a.reviews || 0);
        case "distance":
          return Math.random() - 0.5;
        default:
          return (a.rank || 0) - (b.rank || 0);
      }
    });
    return filtered;
  }
}
