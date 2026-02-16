import React, { useEffect, useRef, useState } from 'react';

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
  const markersRef = useRef<google.maps.Marker[]>([]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      console.error('Google Maps API key not found');
      return;
    }

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
    script.async = true;
    script.defer = true;
    script.onload = () => setIsLoaded(true);
    script.onerror = () => console.error('Failed to load Google Maps script');
    document.head.appendChild(script);

    return () => {
      const existingScript = document.querySelector(
        `script[src^="https://maps.googleapis.com/maps/api/js"]`
      );
      if (existingScript && existingScript.parentNode) {
        existingScript.parentNode.removeChild(existingScript);
      }
    };
  }, []);

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

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 ${className}`}
        style={{ minHeight: '400px', ...style }}
      >
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-2"></div>
          <p className="font-sans text-sm text-neutral-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return <div ref={mapRef} className={className} style={{ minHeight: '400px', ...style }} />;
};
