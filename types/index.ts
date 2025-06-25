export interface Business {
  id: string | number;
  name: string;
  address: string;
  placeId: string;
  rating?: number;
  reviews?: number;
  lat?: number;
  lng?: number;
  visibility?: number;
  difficulty?: "LOW" | "MEDIUM" | "HIGH";
  rank?: number;
  isTarget?: boolean;
}

export interface Location {
  lat: number;
  lng: number;
}

export interface SearchFilters {
  radius: number;
  minRating: number;
  maxResults: number;
  includeReviews: boolean;
  sortBy: "relevance" | "distance" | "rating" | "reviews";
}

export interface RankingData {
  center: Location;
  timestamp: string;
  businesses: Business[];
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface GoogleMapsWindow extends Window {
  google: typeof google;
}

// Extend global window interface
declare global {
  interface Window extends GoogleMapsWindow {}
}
