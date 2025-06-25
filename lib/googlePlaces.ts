export interface GooglePlacesConfig {
  apiKey: string;
}

export class GooglePlacesService {
  private service: google.maps.places.PlacesService | null = null;
  private apiKey: string;

  constructor(config: GooglePlacesConfig) {
    this.apiKey = config.apiKey;
  }

  init(): void {
    if (typeof window !== "undefined" && window.google) {
      this.service = new window.google.maps.places.PlacesService(
        document.createElement("div")
      );
    }
  }

  async searchBusinesses(
    query: string,
    location: google.maps.LatLng
  ): Promise<google.maps.places.PlaceResult[]> {
    return new Promise((resolve, reject) => {
      if (!this.service) {
        this.init();
      }
      if (!this.service) {
        reject(new Error("Google Places service not initialized"));
        return;
      }
      const request: google.maps.places.TextSearchRequest = {
        query: query,
        location: location,
        radius: 50000,
        type: "establishment",
      };
      this.service.textSearch(request, (results, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && results) {
          resolve(results);
        } else {
          reject(new Error(`Places search failed: ${status}`));
        }
      });
    });
  }

  async getPlaceDetails(
    placeId: string
  ): Promise<google.maps.places.PlaceResult> {
    return new Promise((resolve, reject) => {
      if (!this.service) {
        this.init();
      }
      if (!this.service) {
        reject(new Error("Google Places service not initialized"));
        return;
      }
      const request: google.maps.places.PlaceDetailsRequest = {
        placeId: placeId,
        fields: [
          "name",
          "formatted_address",
          "geometry",
          "rating",
          "user_ratings_total",
        ],
      };
      this.service.getDetails(request, (place, status) => {
        if (status === google.maps.places.PlacesServiceStatus.OK && place) {
          resolve(place);
        } else {
          reject(new Error(`Place details failed: ${status}`));
        }
      });
    });
  }
}
