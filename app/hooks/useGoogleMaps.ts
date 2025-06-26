// hooks/useGoogleMaps.ts
"use client";

import { useState, useEffect, useCallback } from "react";

interface GoogleMapsState {
  isLoaded: boolean;
  loadError: string | null;
  isLoading: boolean;
}

interface UseGoogleMapsReturn extends GoogleMapsState {
  loadGoogleMaps: () => Promise<void>;
}

const GOOGLE_MAPS_SCRIPT_ID = "google-maps-script";

export function useGoogleMaps(apiKey?: string): UseGoogleMapsReturn {
  const [state, setState] = useState<GoogleMapsState>({
    isLoaded: false,
    loadError: null,
    isLoading: false,
  });

  const checkIfLoaded = useCallback((): boolean => {
    return !!(window as any).google?.maps;
  }, []);

  const loadGoogleMaps = useCallback(async (): Promise<void> => {
    // If already loaded, resolve immediately
    if (checkIfLoaded()) {
      setState((prev) => ({ ...prev, isLoaded: true, loadError: null }));
      return;
    }

    // If already loading, wait for it
    if (state.isLoading) {
      return new Promise((resolve, reject) => {
        const checkLoading = () => {
          if (checkIfLoaded()) {
            resolve();
          } else if (state.loadError) {
            reject(new Error(state.loadError));
          } else {
            setTimeout(checkLoading, 100);
          }
        };
        checkLoading();
      });
    }

    setState((prev) => ({ ...prev, isLoading: true, loadError: null }));

    return new Promise((resolve, reject) => {
      try {
        // Check if script already exists
        const existingScript = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
        if (existingScript) {
          existingScript.remove();
        }

        const script = document.createElement("script");
        script.id = GOOGLE_MAPS_SCRIPT_ID;
        script.async = true;
        script.defer = true;

        const key = apiKey || process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
        if (!key) {
          throw new Error("Google Maps API key is required");
        }

        script.src = `https://maps.googleapis.com/maps/api/js?key=${key}&libraries=places,geometry&callback=__googleMapsCallback`;

        // Set up callback
        (window as any).__googleMapsCallback = () => {
          setState({
            isLoaded: true,
            loadError: null,
            isLoading: false,
          });

          // Cleanup
          delete (window as any).__googleMapsCallback;
          resolve();
        };

        script.onerror = () => {
          const error = "Failed to load Google Maps script";
          setState({
            isLoaded: false,
            loadError: error,
            isLoading: false,
          });

          // Cleanup
          delete (window as any).__googleMapsCallback;
          reject(new Error(error));
        };

        // Set timeout for loading
        const timeout = setTimeout(() => {
          const error = "Google Maps script loading timeout";
          setState({
            isLoaded: false,
            loadError: error,
            isLoading: false,
          });

          // Cleanup
          delete (window as any).__googleMapsCallback;
          script.remove();
          reject(new Error(error));
        }, 10000); // 10 second timeout

        script.onload = () => {
          clearTimeout(timeout);
        };

        document.head.appendChild(script);
      } catch (error) {
        const errorMessage =
          error instanceof Error
            ? error.message
            : "Unknown error loading Google Maps";
        setState({
          isLoaded: false,
          loadError: errorMessage,
          isLoading: false,
        });
        reject(error);
      }
    });
  }, [apiKey, checkIfLoaded, state.isLoading, state.loadError]);

  // Auto-load on mount
  useEffect(() => {
    if (!checkIfLoaded() && !state.isLoading && !state.loadError) {
      loadGoogleMaps().catch(console.error);
    }
  }, [checkIfLoaded, loadGoogleMaps, state.isLoading, state.loadError]);

  return {
    ...state,
    loadGoogleMaps,
  };
}
