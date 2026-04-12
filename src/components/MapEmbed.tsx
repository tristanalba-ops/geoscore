"use client";

import { useEffect, useRef, useState } from "react";

declare global {
  interface Window {
    L: any;
  }
}

interface MapEmbedProps {
  lat?: number | null;
  lng?: number | null;
  label: string;
  address?: string; // adresse complète pour geocoding BAN
  markers?: { lat: number; lng: number; label: string; href?: string }[];
  zoom?: number;
  height?: string;
}

async function geocodeViaBAN(address: string): Promise<{ lat: number; lng: number } | null> {
  try {
    const res = await fetch(
      `https://api-adresse.data.gouv.fr/search/?q=${encodeURIComponent(address)}&limit=1`
    );
    const json = await res.json();
    if (json.features && json.features.length > 0) {
      const [lng, lat] = json.features[0].geometry.coordinates;
      return { lat, lng };
    }
  } catch {}
  return null;
}

export function MapEmbed({
  lat,
  lng,
  label,
  address,
  markers,
  zoom = 15,
  height = "350px",
}: MapEmbedProps) {
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<any>(null);
  const [resolvedCoords, setResolvedCoords] = useState<{ lat: number; lng: number } | null>(
    lat && lng ? { lat, lng } : null
  );
  const [loading, setLoading] = useState(!lat || !lng);

  // Geocoding via BAN si pas de coords
  useEffect(() => {
    if (lat && lng) {
      setResolvedCoords({ lat, lng });
      setLoading(false);
      return;
    }
    if (!address) {
      setLoading(false);
      return;
    }
    geocodeViaBAN(address).then((coords) => {
      if (coords) setResolvedCoords(coords);
      setLoading(false);
    });
  }, [lat, lng, address]);

  // Init Leaflet
  useEffect(() => {
    if (!mapRef.current || mapInstanceRef.current || loading) return;
    if (!resolvedCoords && (!markers || markers.length === 0)) return;

    const loadLeaflet = async () => {
      if (!document.querySelector('link[href*="leaflet"]')) {
        const link = document.createElement("link");
        link.rel = "stylesheet";
        link.href = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.css";
        document.head.appendChild(link);
      }

      if (!window.L) {
        await new Promise<void>((resolve) => {
          const script = document.createElement("script");
          script.src = "https://unpkg.com/leaflet@1.9.4/dist/leaflet.js";
          script.onload = () => resolve();
          document.head.appendChild(script);
        });
      }

      const L = window.L;
      const center = resolvedCoords || (markers && markers.length > 0 ? { lat: markers[0].lat, lng: markers[0].lng } : { lat: 46.6, lng: 2.3 });
      const map = L.map(mapRef.current).setView([center.lat, center.lng], zoom);

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap",
      }).addTo(map);

      // Marker principal
      if (resolvedCoords && !markers) {
        L.marker([resolvedCoords.lat, resolvedCoords.lng])
          .addTo(map)
          .bindPopup(`<strong>${label}</strong>`)
          .openPopup();
      }

      // Multi-markers (page rue)
      if (markers && markers.length > 0) {
        const bounds: [number, number][] = [];
        markers.forEach((m) => {
          if (!m.lat || !m.lng) return;
          const popup = m.href
            ? `<a href="${m.href}" style="color:#6c63ff;font-weight:600">${m.label}</a>`
            : `<strong>${m.label}</strong>`;
          L.marker([m.lat, m.lng]).addTo(map).bindPopup(popup);
          bounds.push([m.lat, m.lng]);
        });
        if (bounds.length > 1) {
          map.fitBounds(bounds, { padding: [30, 30] });
        }
      }

      mapInstanceRef.current = map;
    };

    loadLeaflet();

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [resolvedCoords, markers, loading, label, zoom]);

  if (loading) {
    return (
      <div
        className="w-full rounded-xl border border-geo-border flex items-center justify-center text-geo-text2"
        style={{ height, background: "#1a1d27" }}
      >
        Localisation en cours...
      </div>
    );
  }

  if (!resolvedCoords && (!markers || markers.length === 0)) {
    return (
      <div
        className="w-full rounded-xl border border-geo-border flex items-center justify-center text-geo-text2"
        style={{ height, background: "#1a1d27" }}
      >
        Carte non disponible
      </div>
    );
  }

  return (
    <div
      ref={mapRef}
      className="w-full rounded-xl border border-geo-border"
      style={{ height, background: "#1a1d27" }}
    />
  );
}
