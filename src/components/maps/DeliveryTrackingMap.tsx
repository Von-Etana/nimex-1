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
  const [hasAuthError, setHasAuthError] = useState(false);
  const markersRef = useRef<google.maps.Marker[]>([]);
  const pathRef = useRef<google.maps.Polyline | null>(null);

  useEffect(() => {
    (window as any).gm_authFailure = () => {
      console.warn('Google Maps auth error in DeliveryTrackingMap, falling back to OSM');
      setHasAuthError(true);
    };

    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) {
      setHasAuthError(true);
      return;
    }

    if (window.google && window.google.maps) {
      setIsLoaded(true);
      return;
    }

    const timeout = setTimeout(() => {
      if (!window.google?.maps) {
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
    };
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

  if (hasAuthError) {
    const pLat = pickupLocation.lat || 6.5244;
    const pLng = pickupLocation.lng || 3.3792;
    const dLat = deliveryLocation.lat || 6.5244;
    const dLng = deliveryLocation.lng || 3.3792;

    const minLat = Math.min(pLat, dLat) - 0.02;
    const maxLat = Math.max(pLat, dLat) + 0.02;
    const minLng = Math.min(pLng, dLng) - 0.02;
    const maxLng = Math.max(pLng, dLng) + 0.02;

    return (
      <div className="relative space-y-3">
        <div className={`relative overflow-hidden rounded-lg border border-neutral-200 bg-neutral-100 ${className}`} style={{ minHeight: '380px' }}>
          <iframe
            title="Delivery Route Map"
            width="100%"
            height="100%"
            style={{ minHeight: '380px', border: 0 }}
            loading="lazy"
            src={`https://www.openstreetmap.org/export/embed.html?bbox=${minLng}%2C${minLat}%2C${maxLng}%2C${maxLat}&layer=mapnik&marker=${dLat}%2C${dLng}`}
          />
        </div>
        <div className="bg-white rounded-lg border border-neutral-200 shadow-sm p-4 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-100">
            <span className="text-xs font-semibold uppercase tracking-wider text-neutral-500">Live Logistics Route</span>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-primary-100 text-primary-800 font-bold capitalize">
              {deliveryStatus.replace('_', ' ')}
            </span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-green-700 mt-1 flex-shrink-0" />
              <div>
                <p className="font-bold text-neutral-800">Origin / Stall</p>
                <p className="text-neutral-600 line-clamp-1">{pickupLocation.address}</p>
              </div>
            </div>
            <div className="flex items-start gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-red-600 mt-1 flex-shrink-0" />
              <div>
                <p className="font-bold text-neutral-800">Destination</p>
                <p className="text-neutral-600 line-clamp-1">{deliveryLocation.address}</p>
              </div>
            </div>
          </div>
          <div className="flex gap-2 pt-1">
            <a
              href={`https://www.google.com/maps/dir/?api=1&origin=${pLat},${pLng}&destination=${dLat},${dLng}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 text-center py-2 px-3 bg-primary-900 text-white rounded text-xs font-semibold hover:bg-black transition-colors"
            >
              Track Route on Google Maps
            </a>
          </div>
        </div>
      </div>
    );
  }

  if (!isLoaded) {
    return (
      <div
        className={`flex items-center justify-center bg-neutral-100 rounded-lg ${className}`}
        style={{ minHeight: '400px' }}
      >
        <div className="text-center">
          <Package className="w-12 h-12 text-primary-600 mx-auto mb-2 animate-pulse" />
          <p className="font-sans text-sm text-neutral-600">Connecting tracking map...</p>
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
