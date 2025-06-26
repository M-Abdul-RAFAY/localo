// lib/geocodingService.ts
export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted_address?: string;
  place_id?: string;
}

export class GeocodingService {
  private apiKey: string;

  constructor(apiKey: string) {
    this.apiKey = apiKey;
  }

  // Try multiple geocoding strategies
  async geocodeLocation(location: string): Promise<GeocodeResult> {
    console.log(`Attempting to geocode: "${location}"`);

    // Strategy 1: Try Google Geocoding API
    try {
      const result = await this.googleGeocode(location);
      console.log("Google Geocoding successful:", result);
      return result;
    } catch (error) {
      console.warn("Google Geocoding failed:", error);
    }

    // Strategy 2: Try browser geolocation if location looks like coordinates
    const coordsMatch = location.match(/^(-?\d+\.?\d*),\s*(-?\d+\.?\d*)$/);
    if (coordsMatch) {
      const lat = parseFloat(coordsMatch[1]);
      const lng = parseFloat(coordsMatch[2]);
      if (this.isValidCoordinate(lat, lng)) {
        console.log("Using coordinate parsing:", { lat, lng });
        return { lat, lng, formatted_address: location };
      }
    }

    // Strategy 3: Try client-side geocoding with Google Maps
    if (typeof window !== "undefined" && window.google?.maps) {
      try {
        const result = await this.clientGeocode(location);
        console.log("Client-side geocoding successful:", result);
        return result;
      } catch (error) {
        console.warn("Client-side geocoding failed:", error);
      }
    }

    // Strategy 4: Use location name matching for common cities
    const cityResult = this.getCityCoordinates(location);
    if (cityResult) {
      console.log("Using city database match:", cityResult);
      return cityResult;
    }

    // Strategy 5: Last resort - use default location (Los Angeles)
    console.warn(
      `All geocoding strategies failed for "${location}", using default location`
    );
    return {
      lat: 34.0522,
      lng: -118.2437,
      formatted_address: "Los Angeles, CA, USA",
    };
  }

  private async googleGeocode(location: string): Promise<GeocodeResult> {
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
      location
    )}&key=${this.apiKey}`;

    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();

    if (data.status === "ZERO_RESULTS") {
      throw new Error(`No results found for "${location}"`);
    }

    if (data.status !== "OK") {
      throw new Error(
        `Geocoding API error: ${data.status} - ${
          data.error_message || "Unknown error"
        }`
      );
    }

    if (!data.results?.length) {
      throw new Error("No geocoding results returned");
    }

    const result = data.results[0];
    return {
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      place_id: result.place_id,
    };
  }

  private async clientGeocode(location: string): Promise<GeocodeResult> {
    return new Promise((resolve, reject) => {
      const geocoder = new window.google.maps.Geocoder();

      geocoder.geocode({ address: location }, (results, status) => {
        if (status === "OK" && results?.[0]) {
          const result = results[0];
          resolve({
            lat: result.geometry.location.lat(),
            lng: result.geometry.location.lng(),
            formatted_address: result.formatted_address,
            place_id: result.place_id,
          });
        } else {
          reject(new Error(`Client geocoding failed: ${status}`));
        }
      });
    });
  }

  private getCityCoordinates(location: string): GeocodeResult | null {
    const locationLower = location.toLowerCase().trim();

    // Common US cities database
    const cityDatabase: Record<string, GeocodeResult> = {
      // California
      "los angeles": {
        lat: 34.0522,
        lng: -118.2437,
        formatted_address: "Los Angeles, CA, USA",
      },
      "los angeles, ca": {
        lat: 34.0522,
        lng: -118.2437,
        formatted_address: "Los Angeles, CA, USA",
      },
      "san francisco": {
        lat: 37.7749,
        lng: -122.4194,
        formatted_address: "San Francisco, CA, USA",
      },
      "san francisco, ca": {
        lat: 37.7749,
        lng: -122.4194,
        formatted_address: "San Francisco, CA, USA",
      },
      "san diego": {
        lat: 32.7157,
        lng: -117.1611,
        formatted_address: "San Diego, CA, USA",
      },
      "san diego, ca": {
        lat: 32.7157,
        lng: -117.1611,
        formatted_address: "San Diego, CA, USA",
      },

      // New York
      "new york": {
        lat: 40.7128,
        lng: -74.006,
        formatted_address: "New York, NY, USA",
      },
      "new york, ny": {
        lat: 40.7128,
        lng: -74.006,
        formatted_address: "New York, NY, USA",
      },
      "new york city": {
        lat: 40.7128,
        lng: -74.006,
        formatted_address: "New York, NY, USA",
      },
      nyc: {
        lat: 40.7128,
        lng: -74.006,
        formatted_address: "New York, NY, USA",
      },

      // Other major cities
      chicago: {
        lat: 41.8781,
        lng: -87.6298,
        formatted_address: "Chicago, IL, USA",
      },
      "chicago, il": {
        lat: 41.8781,
        lng: -87.6298,
        formatted_address: "Chicago, IL, USA",
      },
      houston: {
        lat: 29.7604,
        lng: -95.3698,
        formatted_address: "Houston, TX, USA",
      },
      "houston, tx": {
        lat: 29.7604,
        lng: -95.3698,
        formatted_address: "Houston, TX, USA",
      },
      phoenix: {
        lat: 33.4484,
        lng: -112.074,
        formatted_address: "Phoenix, AZ, USA",
      },
      "phoenix, az": {
        lat: 33.4484,
        lng: -112.074,
        formatted_address: "Phoenix, AZ, USA",
      },
      philadelphia: {
        lat: 39.9526,
        lng: -75.1652,
        formatted_address: "Philadelphia, PA, USA",
      },
      "philadelphia, pa": {
        lat: 39.9526,
        lng: -75.1652,
        formatted_address: "Philadelphia, PA, USA",
      },
      "san antonio": {
        lat: 29.4241,
        lng: -98.4936,
        formatted_address: "San Antonio, TX, USA",
      },
      "san antonio, tx": {
        lat: 29.4241,
        lng: -98.4936,
        formatted_address: "San Antonio, TX, USA",
      },
      dallas: {
        lat: 32.7767,
        lng: -96.797,
        formatted_address: "Dallas, TX, USA",
      },
      "dallas, tx": {
        lat: 32.7767,
        lng: -96.797,
        formatted_address: "Dallas, TX, USA",
      },
      "san jose": {
        lat: 37.3382,
        lng: -121.8863,
        formatted_address: "San Jose, CA, USA",
      },
      "san jose, ca": {
        lat: 37.3382,
        lng: -121.8863,
        formatted_address: "San Jose, CA, USA",
      },
      austin: {
        lat: 30.2672,
        lng: -97.7431,
        formatted_address: "Austin, TX, USA",
      },
      "austin, tx": {
        lat: 30.2672,
        lng: -97.7431,
        formatted_address: "Austin, TX, USA",
      },
      "fort worth": {
        lat: 32.7555,
        lng: -97.3308,
        formatted_address: "Fort Worth, TX, USA",
      },
      "fort worth, tx": {
        lat: 32.7555,
        lng: -97.3308,
        formatted_address: "Fort Worth, TX, USA",
      },
      columbus: {
        lat: 39.9612,
        lng: -82.9988,
        formatted_address: "Columbus, OH, USA",
      },
      "columbus, oh": {
        lat: 39.9612,
        lng: -82.9988,
        formatted_address: "Columbus, OH, USA",
      },
      charlotte: {
        lat: 35.2271,
        lng: -80.8431,
        formatted_address: "Charlotte, NC, USA",
      },
      "charlotte, nc": {
        lat: 35.2271,
        lng: -80.8431,
        formatted_address: "Charlotte, NC, USA",
      },
      indianapolis: {
        lat: 39.7684,
        lng: -86.1581,
        formatted_address: "Indianapolis, IN, USA",
      },
      "indianapolis, in": {
        lat: 39.7684,
        lng: -86.1581,
        formatted_address: "Indianapolis, IN, USA",
      },
      seattle: {
        lat: 47.6062,
        lng: -122.3321,
        formatted_address: "Seattle, WA, USA",
      },
      "seattle, wa": {
        lat: 47.6062,
        lng: -122.3321,
        formatted_address: "Seattle, WA, USA",
      },
      denver: {
        lat: 39.7392,
        lng: -104.9903,
        formatted_address: "Denver, CO, USA",
      },
      "denver, co": {
        lat: 39.7392,
        lng: -104.9903,
        formatted_address: "Denver, CO, USA",
      },
      washington: {
        lat: 38.9072,
        lng: -77.0369,
        formatted_address: "Washington, DC, USA",
      },
      "washington, dc": {
        lat: 38.9072,
        lng: -77.0369,
        formatted_address: "Washington, DC, USA",
      },
      boston: {
        lat: 42.3601,
        lng: -71.0589,
        formatted_address: "Boston, MA, USA",
      },
      "boston, ma": {
        lat: 42.3601,
        lng: -71.0589,
        formatted_address: "Boston, MA, USA",
      },
      "el paso": {
        lat: 31.7619,
        lng: -106.485,
        formatted_address: "El Paso, TX, USA",
      },
      "el paso, tx": {
        lat: 31.7619,
        lng: -106.485,
        formatted_address: "El Paso, TX, USA",
      },
      nashville: {
        lat: 36.1627,
        lng: -86.7816,
        formatted_address: "Nashville, TN, USA",
      },
      "nashville, tn": {
        lat: 36.1627,
        lng: -86.7816,
        formatted_address: "Nashville, TN, USA",
      },
      detroit: {
        lat: 42.3314,
        lng: -83.0458,
        formatted_address: "Detroit, MI, USA",
      },
      "detroit, mi": {
        lat: 42.3314,
        lng: -83.0458,
        formatted_address: "Detroit, MI, USA",
      },
      portland: {
        lat: 45.5152,
        lng: -122.6784,
        formatted_address: "Portland, OR, USA",
      },
      "portland, or": {
        lat: 45.5152,
        lng: -122.6784,
        formatted_address: "Portland, OR, USA",
      },
      "las vegas": {
        lat: 36.1699,
        lng: -115.1398,
        formatted_address: "Las Vegas, NV, USA",
      },
      "las vegas, nv": {
        lat: 36.1699,
        lng: -115.1398,
        formatted_address: "Las Vegas, NV, USA",
      },
      memphis: {
        lat: 35.1495,
        lng: -90.049,
        formatted_address: "Memphis, TN, USA",
      },
      "memphis, tn": {
        lat: 35.1495,
        lng: -90.049,
        formatted_address: "Memphis, TN, USA",
      },
      louisville: {
        lat: 38.2527,
        lng: -85.7585,
        formatted_address: "Louisville, KY, USA",
      },
      "louisville, ky": {
        lat: 38.2527,
        lng: -85.7585,
        formatted_address: "Louisville, KY, USA",
      },
      baltimore: {
        lat: 39.2904,
        lng: -76.6122,
        formatted_address: "Baltimore, MD, USA",
      },
      "baltimore, md": {
        lat: 39.2904,
        lng: -76.6122,
        formatted_address: "Baltimore, MD, USA",
      },
      milwaukee: {
        lat: 43.0389,
        lng: -87.9065,
        formatted_address: "Milwaukee, WI, USA",
      },
      "milwaukee, wi": {
        lat: 43.0389,
        lng: -87.9065,
        formatted_address: "Milwaukee, WI, USA",
      },
      albuquerque: {
        lat: 35.0844,
        lng: -106.6504,
        formatted_address: "Albuquerque, NM, USA",
      },
      "albuquerque, nm": {
        lat: 35.0844,
        lng: -106.6504,
        formatted_address: "Albuquerque, NM, USA",
      },
      tucson: {
        lat: 32.2226,
        lng: -110.9747,
        formatted_address: "Tucson, AZ, USA",
      },
      "tucson, az": {
        lat: 32.2226,
        lng: -110.9747,
        formatted_address: "Tucson, AZ, USA",
      },
      fresno: {
        lat: 36.7378,
        lng: -119.7871,
        formatted_address: "Fresno, CA, USA",
      },
      "fresno, ca": {
        lat: 36.7378,
        lng: -119.7871,
        formatted_address: "Fresno, CA, USA",
      },
      sacramento: {
        lat: 38.5816,
        lng: -121.4944,
        formatted_address: "Sacramento, CA, USA",
      },
      "sacramento, ca": {
        lat: 38.5816,
        lng: -121.4944,
        formatted_address: "Sacramento, CA, USA",
      },
      "kansas city": {
        lat: 39.0997,
        lng: -94.5786,
        formatted_address: "Kansas City, MO, USA",
      },
      "kansas city, mo": {
        lat: 39.0997,
        lng: -94.5786,
        formatted_address: "Kansas City, MO, USA",
      },
      mesa: {
        lat: 33.4152,
        lng: -111.8315,
        formatted_address: "Mesa, AZ, USA",
      },
      "mesa, az": {
        lat: 33.4152,
        lng: -111.8315,
        formatted_address: "Mesa, AZ, USA",
      },
      atlanta: {
        lat: 33.749,
        lng: -84.388,
        formatted_address: "Atlanta, GA, USA",
      },
      "atlanta, ga": {
        lat: 33.749,
        lng: -84.388,
        formatted_address: "Atlanta, GA, USA",
      },
      "colorado springs": {
        lat: 38.8339,
        lng: -104.8214,
        formatted_address: "Colorado Springs, CO, USA",
      },
      "colorado springs, co": {
        lat: 38.8339,
        lng: -104.8214,
        formatted_address: "Colorado Springs, CO, USA",
      },
      omaha: {
        lat: 41.2565,
        lng: -95.9345,
        formatted_address: "Omaha, NE, USA",
      },
      "omaha, ne": {
        lat: 41.2565,
        lng: -95.9345,
        formatted_address: "Omaha, NE, USA",
      },
      raleigh: {
        lat: 35.7796,
        lng: -78.6382,
        formatted_address: "Raleigh, NC, USA",
      },
      "raleigh, nc": {
        lat: 35.7796,
        lng: -78.6382,
        formatted_address: "Raleigh, NC, USA",
      },
      miami: {
        lat: 25.7617,
        lng: -80.1918,
        formatted_address: "Miami, FL, USA",
      },
      "miami, fl": {
        lat: 25.7617,
        lng: -80.1918,
        formatted_address: "Miami, FL, USA",
      },
      oakland: {
        lat: 37.8044,
        lng: -122.2712,
        formatted_address: "Oakland, CA, USA",
      },
      "oakland, ca": {
        lat: 37.8044,
        lng: -122.2712,
        formatted_address: "Oakland, CA, USA",
      },
      minneapolis: {
        lat: 44.9778,
        lng: -93.265,
        formatted_address: "Minneapolis, MN, USA",
      },
      "minneapolis, mn": {
        lat: 44.9778,
        lng: -93.265,
        formatted_address: "Minneapolis, MN, USA",
      },
      tulsa: {
        lat: 36.154,
        lng: -95.9928,
        formatted_address: "Tulsa, OK, USA",
      },
      "tulsa, ok": {
        lat: 36.154,
        lng: -95.9928,
        formatted_address: "Tulsa, OK, USA",
      },
      cleveland: {
        lat: 41.4993,
        lng: -81.6944,
        formatted_address: "Cleveland, OH, USA",
      },
      "cleveland, oh": {
        lat: 41.4993,
        lng: -81.6944,
        formatted_address: "Cleveland, OH, USA",
      },
      wichita: {
        lat: 37.6872,
        lng: -97.3301,
        formatted_address: "Wichita, KS, USA",
      },
      "wichita, ks": {
        lat: 37.6872,
        lng: -97.3301,
        formatted_address: "Wichita, KS, USA",
      },
      arlington: {
        lat: 32.7357,
        lng: -97.1081,
        formatted_address: "Arlington, TX, USA",
      },
      "arlington, tx": {
        lat: 32.7357,
        lng: -97.1081,
        formatted_address: "Arlington, TX, USA",
      },

      // Canadian cities
      toronto: {
        lat: 43.6532,
        lng: -79.3832,
        formatted_address: "Toronto, ON, Canada",
      },
      "toronto, on": {
        lat: 43.6532,
        lng: -79.3832,
        formatted_address: "Toronto, ON, Canada",
      },
      vancouver: {
        lat: 49.2827,
        lng: -123.1207,
        formatted_address: "Vancouver, BC, Canada",
      },
      "vancouver, bc": {
        lat: 49.2827,
        lng: -123.1207,
        formatted_address: "Vancouver, BC, Canada",
      },
      montreal: {
        lat: 45.5017,
        lng: -73.5673,
        formatted_address: "Montreal, QC, Canada",
      },
      "montreal, qc": {
        lat: 45.5017,
        lng: -73.5673,
        formatted_address: "Montreal, QC, Canada",
      },
      calgary: {
        lat: 51.0447,
        lng: -114.0719,
        formatted_address: "Calgary, AB, Canada",
      },
      "calgary, ab": {
        lat: 51.0447,
        lng: -114.0719,
        formatted_address: "Calgary, AB, Canada",
      },
      ottawa: {
        lat: 45.4215,
        lng: -75.6972,
        formatted_address: "Ottawa, ON, Canada",
      },
      "ottawa, on": {
        lat: 45.4215,
        lng: -75.6972,
        formatted_address: "Ottawa, ON, Canada",
      },
      edmonton: {
        lat: 53.5461,
        lng: -113.4938,
        formatted_address: "Edmonton, AB, Canada",
      },
      "edmonton, ab": {
        lat: 53.5461,
        lng: -113.4938,
        formatted_address: "Edmonton, AB, Canada",
      },
    };

    // Try exact match first
    let result = cityDatabase[locationLower];
    if (result) return result;

    // Try partial matches
    for (const [city, coords] of Object.entries(cityDatabase)) {
      if (locationLower.includes(city) || city.includes(locationLower)) {
        return coords;
      }
    }

    return null;
  }

  private isValidCoordinate(lat: number, lng: number): boolean {
    return lat >= -90 && lat <= 90 && lng >= -180 && lng <= 180;
  }

  // Enhanced location suggestion
  suggestLocation(input: string): string[] {
    const inputLower = input.toLowerCase();
    const suggestions: string[] = [];

    // Common location patterns
    const cityDatabase = [
      "Los Angeles, CA",
      "New York, NY",
      "Chicago, IL",
      "Houston, TX",
      "Phoenix, AZ",
      "Philadelphia, PA",
      "San Antonio, TX",
      "San Diego, CA",
      "Dallas, TX",
      "San Jose, CA",
      "Austin, TX",
      "Fort Worth, TX",
      "Columbus, OH",
      "Charlotte, NC",
      "Indianapolis, IN",
      "Seattle, WA",
      "Denver, CO",
      "Washington, DC",
      "Boston, MA",
      "El Paso, TX",
      "Nashville, TN",
      "Detroit, MI",
      "Portland, OR",
      "Las Vegas, NV",
      "Memphis, TN",
      "Louisville, KY",
      "Baltimore, MD",
      "Milwaukee, WI",
      "Albuquerque, NM",
      "Tucson, AZ",
      "Fresno, CA",
      "Sacramento, CA",
      "Kansas City, MO",
      "Mesa, AZ",
      "Atlanta, GA",
      "Colorado Springs, CO",
      "Omaha, NE",
      "Raleigh, NC",
      "Miami, FL",
      "Oakland, CA",
      "Minneapolis, MN",
      "Tulsa, OK",
      "Cleveland, OH",
      "Wichita, KS",
      "Arlington, TX",
      "San Francisco, CA",
    ];

    for (const city of cityDatabase) {
      if (city.toLowerCase().startsWith(inputLower)) {
        suggestions.push(city);
      }
    }

    return suggestions.slice(0, 5); // Return top 5 suggestions
  }
}
