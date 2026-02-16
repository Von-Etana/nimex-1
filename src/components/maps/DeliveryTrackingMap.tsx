import React, { useEffect, useState, useRef } from 'react';
import { Package, MapPin, Navigation } from 'lucide-react';

interface DeliveryTrackingMapProps {
  pickupLocation: { lat: number; lng: number; address: string };
  deliveryLocation: { lat: number; lng: number; address: string };
  currentLocation?: { lat: number; lng: number };
  deliveryStatus: string;
  className?: string;
}

export const DeliveryTrackingMap: React.FC<DeliveryTrackingMapProps> = ({
  pickupLocation,
  deliveryLocation,
  currentLocation,
  deliveryStatus,
  className = '',
}) => {
  const mapRef = useRef<HTMLDivElement>(null);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const pathRef = useRef<google.maps.Polyline | null>(null);

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

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(pickupLocation);
    bounds.extend(deliveryLocation);

    const newMap = new google.maps.Map(mapRef.current, {
      center: bounds.getCenter(),
      zoom: 12,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: true,
    });

    newMap.fitBounds(bounds);
    setMap(newMap);
  }, [isLoaded, pickupLocation, deliveryLocation]);

  useEffect(() => {
    if (!map) return;

    markersRef.current.forEach((marker) => marker.setMap(null));
    markersRef.current = [];

    if (pathRef.current) {
      pathRef.current.setMap(null);
    }

    const pickupMarker = new google.maps.Marker({
      position: pickupLocation,
      map,
      title: 'Pickup Location',
      label: {
        text: 'P',
        color: 'white',
        fontWeight: 'bold',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#15803d',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    });

    const pickupInfo = new google.maps.InfoWindow({
      content: `<div class="p-2"><strong>Pickup Location</strong><br/>${pickupLocation.address}</div>`,
    });
    pickupMarker.addListener('click', () => pickupInfo.open(map, pickupMarker));

    const deliveryMarker = new google.maps.Marker({
      position: deliveryLocation,
      map,
      title: 'Delivery Location',
      label: {
        text: 'D',
        color: 'white',
        fontWeight: 'bold',
      },
      icon: {
        path: google.maps.SymbolPath.CIRCLE,
        scale: 12,
        fillColor: '#dc2626',
        fillOpacity: 1,
        strokeColor: '#fff',
        strokeWeight: 2,
      },
    });

    const deliveryInfo = new google.maps.InfoWindow({
      content: `<div class="p-2"><strong>Delivery Location</strong><br/>${deliveryLocation.address}</div>`,
    });
    deliveryMarker.addListener('click', () => deliveryInfo.open(map, deliveryMarker));

    markersRef.current.push(pickupMarker, deliveryMarker);

    if (currentLocation) {
      const currentMarker = new google.maps.Marker({
        position: currentLocation,
        map,
        title: 'Current Location',
        animation: google.maps.Animation.BOUNCE,
        icon: {
          path: google.maps.SymbolPath.CIRCLE,
          scale: 10,
          fillColor: '#3b82f6',
          fillOpacity: 1,
          strokeColor: '#fff',
          strokeWeight: 3,
        },
      });

      const currentInfo = new google.maps.InfoWindow({
        content: `<div class="p-2"><strong>Package Location</strong><br/>Status: ${deliveryStatus}</div>`,
      });
      currentMarker.addListener('click', () => currentInfo.open(map, currentMarker));

      markersRef.current.push(currentMarker);
    }

    const routePath = new google.maps.Polyline({
      path: currentLocation
        ? [pickupLocation, currentLocation, deliveryLocation]
        : [pickupLocation, deliveryLocation],
      geodesic: true,
      strokeColor: '#3b82f6',
      strokeOpacity: 0.7,
      strokeWeight: 4,
    });

    routePath.setMap(map);
    pathRef.current = routePath;

    const bounds = new google.maps.LatLngBounds();
    bounds.extend(pickupLocation);
    bounds.extend(deliveryLocation);
    if (currentLocation) bounds.extend(currentLocation);
    map.fitBounds(bounds);
  }, [map, pickupLocation, deliveryLocation, currentLocation, deliveryStatus]);

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 rounded-lg ${className}`}
        style={{ minHeight: '400px' }}
      >
        <div className="text-center">
          <Package className="w-12 h-12 text-primary-600 mx-auto mb-2 animate-pulse" />
          <p className="font-sans text-sm text-neutral-600">Loading tracking map...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative">
      <div ref={mapRef} className={className} style={{ minHeight: '400px' }} />
      <div className="absolute bottom-4 left-4 right-4 bg-white rounded-lg shadow-lg p-3 md:p-4">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-green-700"></div>
            <span className="font-sans text-xs md:text-sm text-neutral-700">Pickup</span>
          </div>
          {currentLocation && (
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-blue-500 animate-pulse"></div>
              <span className="font-sans text-xs md:text-sm text-neutral-700">Current</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-full bg-red-600"></div>
            <span className="font-sans text-xs md:text-sm text-neutral-700">Delivery</span>
          </div>
        </div>
      </div>
    </div>
  );
};
