import { useEffect, useMemo, useRef, useState } from "react";
import mapboxgl from "mapbox-gl";
import type { Listing } from "@/lib/api";
import { cn } from "@/lib/utils";
import "mapbox-gl/dist/mapbox-gl.css";

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;
const DEFAULT_CENTER: [number, number] = [99.942, 9.544];
const DEFAULT_ZOOM = 11.2;

const VALID_BOUNDS = {
  minLng: 99.7,
  maxLng: 100.3,
  minLat: 9.2,
  maxLat: 9.9,
};

const isWithinBounds = (lng: number, lat: number) =>
  lng >= VALID_BOUNDS.minLng &&
  lng <= VALID_BOUNDS.maxLng &&
  lat >= VALID_BOUNDS.minLat &&
  lat <= VALID_BOUNDS.maxLat;

interface DirectoryMapProps {
  listings: Listing[];
  className?: string;
  onVisibleListingsChange?: (ids: string[]) => void;
}

interface MapPoint {
  id: string;
  name: string;
  slug: string;
  lat: number;
  lng: number;
  location: string;
  image?: string;
}

export const DirectoryMap = ({ listings, className, onVisibleListingsChange }: DirectoryMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markersRef = useRef<mapboxgl.Marker[]>([]);
  const userMarkerRef = useRef<mapboxgl.Marker | null>(null);
  const pointsRef = useRef<MapPoint[]>([]);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [requestingLocation, setRequestingLocation] = useState(false);

  const hasBrowser = typeof window !== "undefined";

  const points = useMemo<MapPoint[]>(() => {
    return listings
      .map((listing) => {
        const lat = Number(listing.mapLatitude);
        const lng = Number(listing.mapLongitude);
        if (
          !Number.isFinite(lat) ||
          !Number.isFinite(lng) ||
          lng < VALID_BOUNDS.minLng ||
          lng > VALID_BOUNDS.maxLng ||
          lat < VALID_BOUNDS.minLat ||
          lat > VALID_BOUNDS.maxLat
        ) {
          return null;
        }
        return {
          id: listing.id,
          name: listing.name || "Untitled Listing",
          slug: listing.slug,
          lat,
          lng,
          location: listing.location || "",
          image: listing.imageUrl || listing.remoteImageUrl,
        };
      })
      .filter((point): point is MapPoint => Boolean(point));
  }, [listings]);

  useEffect(() => {
    pointsRef.current = points;
  }, [points]);

  useEffect(() => {
    if (!hasBrowser || typeof navigator === "undefined" || !navigator.geolocation) {
      return;
    }
    let isMounted = true;
    setRequestingLocation(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        if (!isMounted) return;
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationError(null);
        setRequestingLocation(false);
      },
      (error) => {
        if (!isMounted) return;
        setLocationError(error.message);
        setRequestingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 5 * 60 * 1000 }
    );
    return () => {
      isMounted = false;
    };
  }, [hasBrowser]);

  useEffect(() => {
    if (!hasBrowser || !containerRef.current || !MAPBOX_TOKEN) {
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: DEFAULT_CENTER,
      zoom: DEFAULT_ZOOM,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "bottom-right");
    mapRef.current = map;

    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      markersRef.current = [];
      userMarkerRef.current?.remove();
      userMarkerRef.current = null;
      map.remove();
      mapRef.current = null;
    };
  }, [hasBrowser]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    markersRef.current.forEach((marker) => marker.remove());
    markersRef.current = [];

    if (points.length === 0) {
      return;
    }

    const bounds = new mapboxgl.LngLatBounds();

    points.forEach((point) => {
      const popupHtml = `
        <div style="min-width: 180px;">
          <strong>${point.name}</strong>
          <div style="font-size: 12px; color: #555;">${point.location || ""}</div>
        </div>
      `;
      const popup = new mapboxgl.Popup({ offset: 16 }).setHTML(popupHtml);
      const marker = new mapboxgl.Marker({ color: "#f97316" })
        .setLngLat([point.lng, point.lat])
        .setPopup(popup)
        .addTo(map);
      markersRef.current.push(marker);
      bounds.extend([point.lng, point.lat]);
    });

    if (userLocation && isWithinBounds(userLocation.lng, userLocation.lat)) {
      bounds.extend([userLocation.lng, userLocation.lat]);
    }

    const notifyVisible = () => {
      if (!onVisibleListingsChange) return;
      const bounds = map.getBounds();
      const visible = pointsRef.current
        .filter((pt) => bounds.contains([pt.lng, pt.lat]))
        .map((pt) => pt.id);
      onVisibleListingsChange(visible);
    };

    if (onVisibleListingsChange) {
      notifyVisible();
      map.on("moveend", notifyVisible);
      map.on("zoomend", notifyVisible);
    }

    if (points.length === 1 && !userLocation) {
      map.easeTo({ center: [points[0].lng, points[0].lat], zoom: DEFAULT_ZOOM });
    } else {
      map.fitBounds(bounds, { padding: 60, duration: 800, maxZoom: DEFAULT_ZOOM + 1 });
    }

    return () => {
      if (onVisibleListingsChange) {
        map.off("moveend", notifyVisible);
        map.off("zoomend", notifyVisible);
      }
    };
  }, [points, onVisibleListingsChange, userLocation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.remove();
      userMarkerRef.current = null;
    }

    if (!userLocation) {
      return;
    }

    const marker = new mapboxgl.Marker({ color: "#0ea5e9" })
      .setLngLat([userLocation.lng, userLocation.lat])
      .setPopup(new mapboxgl.Popup({ offset: 12 }).setHTML("<strong>You are here</strong>"))
      .addTo(map);
    userMarkerRef.current = marker;

    if (!points.length) {
      map.easeTo({ center: [userLocation.lng, userLocation.lat], zoom: DEFAULT_ZOOM });
    }

    return () => {
      marker.remove();
      userMarkerRef.current = null;
    };
  }, [userLocation, points.length]);

  const containerClass = cn(
    "relative h-96 rounded-xl overflow-hidden border",
    className
  );

  if (!MAPBOX_TOKEN) {
    return (
      <div className={cn(containerClass, "border-dashed flex items-center justify-center text-muted-foreground")}
>
        Set <code>VITE_MAPBOX_TOKEN</code> to enable the interactive map.
      </div>
    );
  }

  return (
    <div className={containerClass}>
      <div ref={containerRef} className="w-full h-full" />
      {points.length === 0 && (
        <div className="absolute inset-0 flex items-center justify-center bg-background/60 text-muted-foreground">
          No listings with map coordinates for the current filters.
        </div>
      )}
      {!requestingLocation && locationError && (
        <div className="absolute bottom-4 left-4 text-xs bg-background/90 text-muted-foreground px-3 py-1.5 rounded-full border">
          Unable to fetch your location: {locationError}
        </div>
      )}
    </div>
  );
};
