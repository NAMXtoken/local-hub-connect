import { useEffect, useRef } from "react";
import mapboxgl from "mapbox-gl";
import type { Listing } from "@/lib/api";
import "mapbox-gl/dist/mapbox-gl.css";

interface BusinessMapProps {
  listing: Listing;
}

const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN;

export const BusinessMap = ({ listing }: BusinessMapProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<mapboxgl.Map | null>(null);
  const markerRef = useRef<mapboxgl.Marker | null>(null);

  const hasBrowser = typeof window !== "undefined";
  const lat = Number(listing.mapLatitude);
  const lng = Number(listing.mapLongitude);
  const hasCoords = Number.isFinite(lat) && Number.isFinite(lng);

  useEffect(() => {
    if (!hasBrowser || !containerRef.current || !MAPBOX_TOKEN || !hasCoords) {
      return;
    }

    mapboxgl.accessToken = MAPBOX_TOKEN;
    const map = new mapboxgl.Map({
      container: containerRef.current,
      style: "mapbox://styles/mapbox/streets-v12",
      center: [lng, lat],
      zoom: 14,
    });

    map.addControl(new mapboxgl.NavigationControl({ visualizePitch: true }), "top-right");
    mapRef.current = map;

    const marker = new mapboxgl.Marker({ color: "#f87171" })
      .setLngLat([lng, lat])
      .setPopup(
        new mapboxgl.Popup({ offset: 16 }).setHTML(
          `<strong>${listing.name || "Listing"}</strong><div style="font-size:12px;color:#555;">${listing.location || ""}</div>`
        )
      )
      .addTo(map);
    markerRef.current = marker;

    return () => {
      marker.remove();
      map.remove();
      markerRef.current = null;
      mapRef.current = null;
    };
  }, [hasBrowser, hasCoords, lat, lng, listing.name, listing.location]);

  if (!hasCoords) {
    return (
      <div className="h-64 rounded-xl border border-dashed flex items-center justify-center text-muted-foreground">
        Map location not available for this listing yet.
      </div>
    );
  }

  if (!MAPBOX_TOKEN) {
    return (
      <div className="h-64 rounded-xl border border-dashed flex items-center justify-center text-muted-foreground">
        Set <code>VITE_MAPBOX_TOKEN</code> to view the interactive map.
      </div>
    );
  }

  return <div ref={containerRef} className="w-full h-64 rounded-xl overflow-hidden" />;
};
