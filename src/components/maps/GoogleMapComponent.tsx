import React, { useEffect, useRef, useState } from 'react';
import { googleMapsService } from '../../services/googleMapsService';

interface GoogleMapComponentProps {
  center?: { lat: number; lng: number };
  zoom?: number;
  markers?: Array<{ lat: number; lng: number; title?: string; onClick?: () => void }>;
  onMapClick?: (lat: number, lng: number) => void;
  className?: string;
  style?: React.CSSProperties;
}

export const GoogleMapComponent: React.FC<GoogleMapComponentProps> = ({
  center = { lat: 6.5244, lng: 3.3792 },
  zoom = 12,
  markers = [],
  onMapClick,
  className = '',
  style = {},
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasAuthError, setHasAuthError] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const hasGoogleMapsKey = googleMapsService.hasApiKey();

  useEffect(() => {
    // Intercept Google Maps authentication errors (e.g. ApiNotActivatedMapError)
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps authentication failure detected. Switching to interactive fallback.');
      setHasAuthError(true);
    };

    if (!hasGoogleMapsKey) {
      setHasAuthError(true);
      return;
    }

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setHasAuthError(true);
      return;
    }

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    // Set a safety timeout to switch to interactive fallback if Google doesn't respond in 4s
    const timeout = setTimeout(() => {
      if (!window.google?.maps) {
        console.warn('Google Maps load timeout. Using fallback map.');
        setHasAuthError(true);
      }
    }, 4000);

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      clearTimeout(timeout);
      setIsLoaded(true);
    };
    script.onerror = () => {
      clearTimeout(timeout);
      setHasAuthError(true);
    };
    document.head.appendChild(script);

    return () => {
      clearTimeout(timeout);
      const existingScript = document.querySelector(
        `script[src^="https://maps.googleapis.com/maps/api/js"]`
      );
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, [hasGoogleMapsKey]);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center,
      zoom,
      styles: [
        {
          featureType: 'poi',
          elementType: 'labels',
          stylers: [{ visibility: 'off' }],
        },
      ],
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    if (onMapClick) {
      newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
        if (e.latLng) {
          onMapClick(e.latLng.lat(), e.latLng.lng());
        }
      });
    }

    setMap(newMap);
  }, [isLoaded, center.lat, center.lng, zoom]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    markers.forEach((markerData) => {
      const marker = new google.maps.Marker({
        position: { lat: markerData.lat, lng: markerData.lng },
        map,
        title: markerData.title || '',
      });

      if (markerData.onClick) {
        marker.addListener('click', markerData.onClick);
      }

      markersRef.current.push(marker);
    });
  }, [map, markers]);

  useEffect(() => {
    if (map && center) {
      map.setCenter(center);
    }
  }, [map, center.lat, center.lng]);

  if (hasAuthError) {
    const lat = center?.lat || 6.5244;
    const lng = center?.lng || 3.3792;
    const bbox = `${lng - 0.015}%2C${lat - 0.015}%2C${lng + 0.015}%2C${lat + 0.015}`;
    return (
      <div className={`relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 ${className}`} style={{ minHeight: '400px', ...style }}>
        <iframe
          title="Interactive Location Map"
          width="100%"
          height="100%"
          style={{ minHeight: '400px', border: 0 }}
          loading="lazy"
          src={`https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}`}
        />
        <div className="absolute bottom-3 left-3 right-3 bg-white/95 backdrop-blur-sm p-3 rounded-lg border border-neutral-200 shadow-sm flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full bg-primary-700 animate-pulse" />
            <span className="font-sans text-xs text-neutral-800 font-medium">
              {lat.toFixed(4)}, {lng.toFixed(4)}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-white border border-neutral-300 text-neutral-800 rounded text-xs font-semibold hover:bg-neutral-50 transition-colors"
            >
              Directions
            </a>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center px-3 py-1 bg-primary-900 text-white rounded text-xs font-semibold hover:bg-black transition-colors"
            >
              Google Maps
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 ${className}`}
        style={{ minHeight: '400px', ...style }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="font-sans text-sm text-neutral-600">Connecting map service...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={className} style={{ minHeight: '400px', ...style }} />;
};
