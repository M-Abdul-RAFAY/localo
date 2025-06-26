// lib/geoGridSystem.ts

export interface GeoPoint {
  lat: number;
  lng: number;
  ringIndex: number;
  pointIndex: number;
  distanceFromCenter: number;
  bearing: number;
  id: string;
}

export interface GridRing {
  ringIndex: number;
  radius: number; // in meters
  pointCount: number;
  points: GeoPoint[];
}

export interface GeoGridConfig {
  center: {
    lat: number;
    lng: number;
  };
  rings: {
    radius: number; // in meters
    pointCount: number;
  }[];
}

export interface GeoGridSystem {
  center: GeoPoint;
  rings: GridRing[];
  allPoints: GeoPoint[];
  totalPoints: number;
  boundingBox: {
    north: number;
    south: number;
    east: number;
    west: number;
  };
}

/**
 * Generates a concentric geo-grid system for local SEO ranking visualization
 */
export class GeoGridGenerator {
  /**
   * Default configuration for 7 rings with increasing density
   */
  static getDefaultConfig(centerLat: number, centerLng: number): GeoGridConfig {
    return {
      center: { lat: centerLat, lng: centerLng },
      rings: [
        { radius: 500, pointCount: 6 }, // Ring 1: 500m, 6 points
        { radius: 1000, pointCount: 8 }, // Ring 2: 1km, 8 points
        { radius: 1500, pointCount: 10 }, // Ring 3: 1.5km, 10 points
        { radius: 2000, pointCount: 12 }, // Ring 4: 2km, 12 points
        { radius: 2500, pointCount: 14 }, // Ring 5: 2.5km, 14 points
        { radius: 3000, pointCount: 16 }, // Ring 6: 3km, 16 points
        { radius: 3500, pointCount: 18 }, // Ring 7: 3.5km, 18 points
      ],
    };
  }

  /**
   * Dense grid configuration for detailed analysis
   */
  static getDenseConfig(centerLat: number, centerLng: number): GeoGridConfig {
    return {
      center: { lat: centerLat, lng: centerLng },
      rings: [
        { radius: 250, pointCount: 8 }, // Ring 1: 250m, 8 points
        { radius: 500, pointCount: 12 }, // Ring 2: 500m, 12 points
        { radius: 750, pointCount: 16 }, // Ring 3: 750m, 16 points
        { radius: 1000, pointCount: 20 }, // Ring 4: 1km, 20 points
        { radius: 1500, pointCount: 24 }, // Ring 5: 1.5km, 24 points
        { radius: 2000, pointCount: 28 }, // Ring 6: 2km, 28 points
        { radius: 2500, pointCount: 32 }, // Ring 7: 2.5km, 32 points
      ],
    };
  }

  /**
   * Wide area configuration for broader market analysis
   */
  static getWideConfig(centerLat: number, centerLng: number): GeoGridConfig {
    return {
      center: { lat: centerLat, lng: centerLng },
      rings: [
        { radius: 1000, pointCount: 6 }, // Ring 1: 1km, 6 points
        { radius: 2000, pointCount: 8 }, // Ring 2: 2km, 8 points
        { radius: 3000, pointCount: 10 }, // Ring 3: 3km, 10 points
        { radius: 5000, pointCount: 12 }, // Ring 4: 5km, 12 points
        { radius: 7500, pointCount: 14 }, // Ring 5: 7.5km, 14 points
        { radius: 10000, pointCount: 16 }, // Ring 6: 10km, 16 points
        { radius: 15000, pointCount: 18 }, // Ring 7: 15km, 18 points
      ],
    };
  }

  /**
   * Generate the complete geo-grid system
   */
  static generate(config: GeoGridConfig): GeoGridSystem {
    const center: GeoPoint = {
      lat: config.center.lat,
      lng: config.center.lng,
      ringIndex: 0,
      pointIndex: 0,
      distanceFromCenter: 0,
      bearing: 0,
      id: "center",
    };

    const rings: GridRing[] = [];
    const allPoints: GeoPoint[] = [center];

    // Generate each ring
    config.rings.forEach((ringConfig, ringIndex) => {
      const ringPoints = this.generateRingPoints(
        config.center,
        ringConfig.radius,
        ringConfig.pointCount,
        ringIndex + 1
      );

      rings.push({
        ringIndex: ringIndex + 1,
        radius: ringConfig.radius,
        pointCount: ringConfig.pointCount,
        points: ringPoints,
      });

      allPoints.push(...ringPoints);
    });

    // Calculate bounding box
    const boundingBox = this.calculateBoundingBox(allPoints);

    return {
      center,
      rings,
      allPoints,
      totalPoints: allPoints.length,
      boundingBox,
    };
  }

  /**
   * Generate points for a single ring
   */
  private static generateRingPoints(
    center: { lat: number; lng: number },
    radius: number,
    pointCount: number,
    ringIndex: number
  ): GeoPoint[] {
    const points: GeoPoint[] = [];
    const angleStep = 360 / pointCount;

    for (let i = 0; i < pointCount; i++) {
      const bearing = i * angleStep;
      const coords = this.calculateDestination(
        center.lat,
        center.lng,
        bearing,
        radius
      );

      points.push({
        lat: coords.lat,
        lng: coords.lng,
        ringIndex,
        pointIndex: i,
        distanceFromCenter: radius,
        bearing,
        id: `ring${ringIndex}_point${i}`,
      });
    }

    return points;
  }

  /**
   * Calculate destination coordinates given start point, bearing, and distance
   * Uses the Haversine formula for accurate geospatial calculations
   */
  private static calculateDestination(
    lat: number,
    lng: number,
    bearing: number,
    distance: number
  ): { lat: number; lng: number } {
    const R = 6371000; // Earth's radius in meters
    const δ = distance / R; // Angular distance in radians
    const φ1 = (lat * Math.PI) / 180; // Latitude in radians
    const λ1 = (lng * Math.PI) / 180; // Longitude in radians
    const θ = (bearing * Math.PI) / 180; // Bearing in radians

    const φ2 = Math.asin(
      Math.sin(φ1) * Math.cos(δ) + Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
    );

    const λ2 =
      λ1 +
      Math.atan2(
        Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
        Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
      );

    return {
      lat: (φ2 * 180) / Math.PI,
      lng: (λ2 * 180) / Math.PI,
    };
  }

  /**
   * Calculate bounding box for all points
   */
  private static calculateBoundingBox(points: GeoPoint[]) {
    let north = -90,
      south = 90,
      east = -180,
      west = 180;

    points.forEach((point) => {
      north = Math.max(north, point.lat);
      south = Math.min(south, point.lat);
      east = Math.max(east, point.lng);
      west = Math.min(west, point.lng);
    });

    return { north, south, east, west };
  }

  /**
   * Convert geo-grid to GeoJSON format for Mapbox
   */
  static toGeoJSON(geoGrid: GeoGridSystem): any {
    return {
      type: "FeatureCollection",
      features: geoGrid.allPoints.map((point) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [point.lng, point.lat],
        },
        properties: {
          id: point.id,
          ringIndex: point.ringIndex,
          pointIndex: point.pointIndex,
          distanceFromCenter: point.distanceFromCenter,
          bearing: point.bearing,
          isCenter: point.ringIndex === 0,
        },
      })),
    };
  }

  /**
   * Get ring circles for visualization (GeoJSON)
   */
  static getRingCircles(geoGrid: GeoGridSystem): any {
    return {
      type: "FeatureCollection",
      features: geoGrid.rings.map((ring) => ({
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: [geoGrid.center.lng, geoGrid.center.lat],
        },
        properties: {
          ringIndex: ring.ringIndex,
          radius: ring.radius,
          pointCount: ring.pointCount,
        },
      })),
    };
  }

  /**
   * Generate points within a specific distance range
   */
  static generatePointsInRange(
    center: { lat: number; lng: number },
    minRadius: number,
    maxRadius: number,
    totalPoints: number
  ): GeoPoint[] {
    const points: GeoPoint[] = [];

    for (let i = 0; i < totalPoints; i++) {
      // Random distance between min and max radius
      const distance = minRadius + Math.random() * (maxRadius - minRadius);

      // Random bearing (0-360 degrees)
      const bearing = Math.random() * 360;

      const coords = this.calculateDestination(
        center.lat,
        center.lng,
        bearing,
        distance
      );

      points.push({
        lat: coords.lat,
        lng: coords.lng,
        ringIndex: -1, // Indicates random point
        pointIndex: i,
        distanceFromCenter: distance,
        bearing,
        id: `random_${i}`,
      });
    }

    return points;
  }
}

/**
 * Mapbox-specific utilities for geo-grid visualization
 */
export class MapboxGeoGridUtils {
  /**
   * Get Mapbox layer configuration for grid points
   */
  static getPointsLayer(sourceId: string): any {
    return {
      id: "grid-points",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": [
          "case",
          ["==", ["get", "isCenter"], true],
          8,
          [
            "case",
            ["<=", ["get", "ringIndex"], 2],
            6,
            ["case", ["<=", ["get", "ringIndex"], 4], 5, 4],
          ],
        ],
        "circle-color": [
          "case",
          ["==", ["get", "isCenter"], true],
          "#FF0000",
          [
            "case",
            ["<=", ["get", "ringIndex"], 2],
            "#00FF00",
            ["case", ["<=", ["get", "ringIndex"], 4], "#FFFF00", "#FF8800"],
          ],
        ],
        "circle-stroke-width": 2,
        "circle-stroke-color": "#FFFFFF",
        "circle-opacity": 0.8,
      },
    };
  }

  /**
   * Get Mapbox layer configuration for ring circles
   */
  static getRingCirclesLayer(sourceId: string): any {
    return {
      id: "grid-rings",
      type: "circle",
      source: sourceId,
      paint: {
        "circle-radius": {
          stops: [
            [8, 10],
            [15, ["*", ["get", "radius"], 0.05]],
          ],
        },
        "circle-color": "transparent",
        "circle-stroke-width": 1,
        "circle-stroke-color": "#666666",
        "circle-stroke-opacity": 0.5,
      },
    };
  }

  /**
   * Generate popup content for a grid point
   */
  static generatePopupContent(point: GeoPoint): string {
    return `
      <div style="padding: 8px; min-width: 200px;">
        <h4 style="margin: 0 0 8px 0; font-weight: bold;">
          ${
            point.ringIndex === 0
              ? "Center Point"
              : `Ring ${point.ringIndex} - Point ${point.pointIndex + 1}`
          }
        </h4>
        <div style="font-size: 12px; line-height: 1.4;">
          <p><strong>Coordinates:</strong> ${point.lat.toFixed(
            6
          )}, ${point.lng.toFixed(6)}</p>
          <p><strong>Distance:</strong> ${
            point.distanceFromCenter
          }m from center</p>
          <p><strong>Bearing:</strong> ${point.bearing.toFixed(1)}°</p>
          <p><strong>ID:</strong> ${point.id}</p>
        </div>
      </div>
    `;
  }
}

/**
 * Usage Examples and Helper Functions
 */
export class GeoGridExamples {
  /**
   * Example: Generate a grid for Los Angeles downtown
   */
  static losAngelesExample(): GeoGridSystem {
    const config = GeoGridGenerator.getDefaultConfig(34.0522, -118.2437);
    return GeoGridGenerator.generate(config);
  }

  /**
   * Example: Generate a custom grid for a specific business location
   */
  static customBusinessGrid(
    businessLat: number,
    businessLng: number,
    maxRadius: number = 3000
  ): GeoGridSystem {
    const config: GeoGridConfig = {
      center: { lat: businessLat, lng: businessLng },
      rings: [
        { radius: maxRadius * 0.1, pointCount: 6 },
        { radius: maxRadius * 0.2, pointCount: 8 },
        { radius: maxRadius * 0.35, pointCount: 10 },
        { radius: maxRadius * 0.5, pointCount: 12 },
        { radius: maxRadius * 0.65, pointCount: 14 },
        { radius: maxRadius * 0.8, pointCount: 16 },
        { radius: maxRadius, pointCount: 18 },
      ],
    };
    return GeoGridGenerator.generate(config);
  }

  /**
   * Example: Generate grid for competitive analysis
   */
  static competitiveAnalysisGrid(
    centerLat: number,
    centerLng: number
  ): GeoGridSystem {
    return GeoGridGenerator.generate(
      GeoGridGenerator.getDenseConfig(centerLat, centerLng)
    );
  }
}

// Export additional utility functions
export const GeoGridUtils = {
  /**
   * Calculate distance between two points in meters
   */
  calculateDistance(
    lat1: number,
    lng1: number,
    lat2: number,
    lng2: number
  ): number {
    const R = 6371000; // Earth's radius in meters
    const φ1 = (lat1 * Math.PI) / 180;
    const φ2 = (lat2 * Math.PI) / 180;
    const Δφ = ((lat2 - lat1) * Math.PI) / 180;
    const Δλ = ((lng2 - lng1) * Math.PI) / 180;

    const a =
      Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
      Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));

    return R * c;
  },

  /**
   * Format distance for display
   */
  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  },

  /**
   * Get points within a specific ring
   */
  getPointsInRing(geoGrid: GeoGridSystem, ringIndex: number): GeoPoint[] {
    return geoGrid.allPoints.filter((point) => point.ringIndex === ringIndex);
  },

  /**
   * Filter points by distance range
   */
  filterPointsByDistance(
    points: GeoPoint[],
    minDistance: number,
    maxDistance: number
  ): GeoPoint[] {
    return points.filter(
      (point) =>
        point.distanceFromCenter >= minDistance &&
        point.distanceFromCenter <= maxDistance
    );
  },
};
