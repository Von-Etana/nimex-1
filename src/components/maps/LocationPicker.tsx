import React, { useState, useEffect, useRef } from 'react';
import { MapPin, Search, Loader2, Navigation, X } from 'lucide-react';
import { Button } from '../ui/button';
import { Card } from '../ui/card';
import { googleMapsService } from '../../services/googleMapsService';

interface LocationPickerProps {
  initialLocation?: { lat: number; lng: number; address?: string };
  onLocationSelect: (location: {
    lat: number;
    lng: number;
    address: string;
    city?: string;
    state?: string;
  }) => void;
  placeholder?: string;
  className?: string;
  variant?: 'default' | 'minimal' | 'search';
  autoDetect?: boolean;
}

export const LocationPicker: React.FC<LocationPickerProps> = ({
  initialLocation,
  onLocationSelect,
  placeholder = 'Search for a location',
  className = '',
  variant = 'default',
  autoDetect = false,
}) => {
  const [searchQuery, setSearchQuery] = useState(initialLocation?.address || '');
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isSearching, setIsSearching] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(initialLocation);
  const [map, setMap] = useState<google.maps.Map | null>(null);
  const [marker, setMarker] = useState<google.maps.Marker | null>(null);
  const [showMap, setShowMap] = useState(variant === 'default');

  const mapRef = useRef<HTMLDivElement>(null);
  const searchTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Sync initial location if changed externally
    if (initialLocation && initialLocation.address !== searchQuery) {
      setSearchQuery(initialLocation.address || '');
      setSelectedLocation(initialLocation);
    }
  }, [initialLocation]);

  useEffect(() => {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (!apiKey) return;

    if (window.google && window.google.maps) {
      if (showMap) initializeMap();
    } else {
      const script = document.createElement('script');
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.onload = () => {
        if (showMap) initializeMap();
      };
      document.head.appendChild(script);
    }
  }, [showMap]);

  useEffect(() => {
    if (autoDetect && !initialLocation) {
      handleUseCurrentLocation();
    }
  }, [autoDetect]);

  const initializeMap = () => {
    if (!mapRef.current) return;

    const initialCenter = selectedLocation || { lat: 6.5244, lng: 3.3792 };

    const newMap = new google.maps.Map(mapRef.current, {
      center: initialCenter,
      zoom: 15,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
      zoomControl: true,
    });

    const newMarker = new google.maps.Marker({
      position: initialCenter,
      map: newMap,
      draggable: true,
      animation: google.maps.Animation.DROP,
    });

    newMarker.addListener('dragend', async () => {
      const position = newMarker.getPosition();
      if (!position) return;

      const lat = position.lat();
      const lng = position.lng();

      try {
        const geocoder = new google.maps.Geocoder();
        const result = await geocoder.geocode({ location: { lat, lng } });

        if (result.results[0]) {
          processLocationResult(result.results[0], lat, lng);
        }
      } catch (error) {
        console.error('Geocoding error:', error);
      }
    });

    newMap.addListener('click', (e: google.maps.MapMouseEvent) => {
      if (e.latLng) {
        newMarker.setPosition(e.latLng);
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();

        // Trigger geocode
        const geocoder = new google.maps.Geocoder();
        geocoder.geocode({ location: { lat, lng } }, (results, status) => {
          if (status === 'OK' && results && results[0]) {
            processLocationResult(results[0], lat, lng);
          }
        });
      }
    });

    setMap(newMap);
    setMarker(newMarker);
  };

  const processLocationResult = (result: google.maps.GeocoderResult, lat: number, lng: number) => {
    const address = result.formatted_address;
    const addressComponents = result.address_components;

    let city = '';
    let state = '';

    addressComponents.forEach((component) => {
      if (component.types.includes('locality')) {
        city = component.long_name;
      }
      if (component.types.includes('administrative_area_level_1')) {
        state = component.long_name;
      }
    });

    setSearchQuery(address);
    setSelectedLocation({ lat, lng, address });
    onLocationSelect({ lat, lng, address, city, state });
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);

    // If empty, clear
    if (!value) {
      onLocationSelect({ lat: 0, lng: 0, address: '' }); // Clear parent
    }

    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    if (value.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setIsSearching(true);

    searchTimeoutRef.current = setTimeout(async () => {
      try {
        const results = await googleMapsService.getAutocompleteSuggestions(value);
        setSuggestions(results);
        setShowSuggestions(true);
      } catch (error) {
        console.error('Error getting suggestions:', error);
      } finally {
        setIsSearching(false);
      }
    }, 500);
  };

  const handleSuggestionClick = async (address: string) => {
    setSearchQuery(address);
    setShowSuggestions(false);
    setIsSearching(true);

    try {
      const results = await googleMapsService.geocodeAddress(address);

      if (results.length > 0) {
        const location = results[0];
        const lat = location.geometry.location.lat;
        const lng = location.geometry.location.lng;

        // Process address components
        // Note: geocodeAddress result might not have full components easily accessible in PlaceResult type usually returned by service?
        // Let's rely on standard Geocoder from maps API or the service result structure.
        // GoogleMapsService.geocodeAddress returns mapped PlaceResult.
        // Assuming we invoke actual geocoder for components if needed or extract from formatted string if specific parsing needed.
        // For simple city/state, let's just create simple defaults or re-geocode geometry if we need precision.
        // Simpler: Just pass what we have.

        let city = '';
        let state = '';
        // Basic parsing from formatted address if components missing
        const parts = address.split(',');
        if (parts.length >= 2) {
          state = parts[parts.length - 2].trim(); // Usually state/country
          city = parts[parts.length - 3]?.trim() || '';
        }

        setSelectedLocation({ lat, lng, address });
        onLocationSelect({ lat, lng, address, city, state });

        if (showMap && map && marker) {
          map.setCenter({ lat, lng });
          marker.setPosition({ lat, lng });
          marker.setMap(map);
          map.setZoom(15);
        }
      }
    } catch (error) {
      console.error('Error geocoding address:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }

    setIsSearching(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        try {
          const geocoder = new google.maps.Geocoder();
          const result = await geocoder.geocode({ location: { lat, lng } });

          if (result.results[0]) {
            processLocationResult(result.results[0], lat, lng);

            if (showMap && map && marker) {
              map.setCenter({ lat, lng });
              marker.setPosition({ lat, lng });
              marker.setMap(map);
            }
          }
        } catch (error) {
          console.error('Error getting current location:', error);
        } finally {
          setIsSearching(false);
        }
      },
      (error) => {
        console.error('Geolocation error:', error);
        setIsSearching(false);
        alert('Unable to retrieve your location. Please check your browser permissions.');
      }
    );
  };

  const toggleMap = () => {
    setShowMap(!showMap);
  };

  return (
    <div className={className}>
      <div className="space-y-3">
        {/* Search Input Area */}
        <div className="relative group">
          <div className="relative flex items-center">
            <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 group-focus-within:text-primary-500 transition-colors" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearchChange(e.target.value)}
              onFocus={() => {
                if (searchQuery.length >= 3 && suggestions.length > 0) setShowSuggestions(true);
              }}
              placeholder={placeholder}
              className={`w-full pl-10 pr-10 py-2.5 bg-white border border-neutral-200 rounded-lg font-sans text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500 transition-all ${variant === 'search' ? 'shadow-sm' : ''}`}
            />
            {isSearching ? (
              <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-primary-500 animate-spin" />
            ) : searchQuery ? (
              <button
                onClick={() => handleSearchChange('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-neutral-600"
              >
                <X className="w-4 h-4" />
              </button>
            ) : null}
          </div>

          {/* Autocomplete Suggestions */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-50 w-full mt-1 bg-white rounded-lg shadow-lg border border-neutral-100 py-1 animate-in fade-in zoom-in-95 duration-200">
              {suggestions.map((suggestion, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(suggestion)}
                  className="w-full px-4 py-2.5 text-left hover:bg-neutral-50 font-sans text-sm text-neutral-700 flex items-center gap-3 transition-colors"
                >
                  <MapPin className="w-4 h-4 text-neutral-400 flex-shrink-0" />
                  <span className="flex-1 line-clamp-1">{suggestion}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Minimal/Default Controls */}
        {variant !== 'search' && (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleUseCurrentLocation}
              disabled={isSearching}
              className="flex-1 font-sans text-xs"
            >
              <Navigation className="w-3 h-3 mr-2" />
              Use Current Location
            </Button>
            {variant === 'minimal' && (
              <Button
                type="button"
                variant={showMap ? 'secondary' : 'outline'}
                size="sm"
                onClick={toggleMap}
                className="font-sans text-xs"
              >
                {showMap ? 'Hide Map' : 'Show Map'}
              </Button>
            )}
          </div>
        )}

        {/* Map View */}
        {(variant === 'default' || (variant === 'minimal' && showMap)) && (
          <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-300">
            <div
              ref={mapRef}
              className="w-full h-64 md:h-80 rounded-xl border border-neutral-200 bg-neutral-100 shadow-inner overflow-hidden"
            />

            {searchQuery && selectedLocation && (
              <div className="p-3 bg-primary-50 border border-primary-100 rounded-lg flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-primary-100 flex items-center justify-center flex-shrink-0">
                  <MapPin className="w-4 h-4 text-primary-600" />
                </div>
                <div>
                  <p className="font-heading font-semibold text-sm text-primary-900">Selected Location</p>
                  <p className="font-sans text-xs text-primary-700 mt-0.5">{searchQuery}</p>
                  <p className="font-sans text-[10px] text-primary-600 mt-1">
                    Drag marker to refine position
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
