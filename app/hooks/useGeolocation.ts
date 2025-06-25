"use client";

import { useState } from "react";
import { Location } from "@/types";

interface GeolocationState {
  location: Location | null;
  error: string | null;
  loading: boolean;
}

interface UseGeolocationReturn extends GeolocationState {
  getCurrentLocation: () => Promise<void>;
}

export function useGeolocation(): UseGeolocationReturn {
  const [state, setState] = useState<GeolocationState>({
    location: null,
    error: null,
    loading: false,
  });

  const getCurrentLocation = async (): Promise<void> => {
    if (!navigator.geolocation) {
      setState((prev) => ({
        ...prev,
        error: "Geolocation is not supported by this browser",
      }));
      return;
    }
    setState((prev) => ({ ...prev, loading: true }));
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setState({
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
            loading: false,
            error: null,
          });
          resolve();
        },
        (error) => {
          setState((prev) => ({
            ...prev,
            error: error.message,
            loading: false,
          }));
          reject(error);
        },
        {
          enableHighAccuracy: true,
          timeout: 5000,
          maximumAge: 0,
        }
      );
    });
  };

  return { ...state, getCurrentLocation };
}
