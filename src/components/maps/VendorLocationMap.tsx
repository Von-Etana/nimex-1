import React, { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, ExternalLink } from 'lucide-react';
import { Button } from '../ui/button';

interface VendorLocationMapProps {
  location: { lat: number; lng: number; address: string };
  businessName: string;
  className?: string;
}

export const VendorLocationMap: React.FC<VendorLocationMapProps> = ({
  location,
  businessName,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

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
  }, []);

  useEffect(() => {
    if (!isLoaded || !mapRef.current || map) return;

    const newMap = new google.maps.Map(mapRef.current, {
      center: location,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: true,
      fullscreenControl: true,
    });

    const marker = new google.maps.Marker({
      position: location,
      map: newMap,
      title: businessName,
      animation: google.maps.Animation.DROP,
    });

    const infoWindow = new google.maps.InfoWindow({
      content: `
        <div class="p-3">
          <h3 class="font-bold text-neutral-900 mb-1">${businessName}</h3>
          <p class="text-sm text-neutral-600">${location.address}</p>
        </div>
      `,
    });

    marker.addListener('click', () => {
      infoWindow.open(newMap, marker);
    });

    infoWindow.open(newMap, marker);
    setMap(newMap);
  }, [isLoaded, location, businessName]);

  const handleGetDirections = () => {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${location.lat},${location.lng}`;
    window.open(url, '_blank');
  };

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 rounded-lg ${className}`}
        style={{ minHeight: '300px' }}
      >
        <div className="text-center">
          <MapPin className="w-8 h-8 text-primary-600 mx-auto mb-2 animate-pulse" />
          <p className="font-sans text-sm text-neutral-600">Loading map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div ref={mapRef} className={className} style={{ minHeight: '300px' }} />
      <div className="flex gap-2">
        <Button variant="outline" onClick={handleGetDirections} className="flex-1">
          <Navigation className="w-4 h-4 mr-2" />
          Get Directions
        </Button>
        <Button
          variant="outline"
          onClick={() =>
            window.open(
              `https://www.google.com/maps/search/?api=1&query=${location.lat},${location.lng}`,
              '_blank'
            )
          }
          className="flex-1"
        >
          <ExternalLink className="w-4 h-4 mr-2" />
          View on Google Maps
        </Button>
      </div>
      <div className="p-3 bg-neutral-50 rounded-lg border border-neutral-200">
        <p className="font-sans text-sm text-neutral-700 flex items-start gap-2">
          <MapPin className="w-4 h-4 text-neutral-500 flex-shrink-0 mt-0.5" />
          <span>{location.address}</span>
        </p>
      </div>
    </div>
  );
};
