import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useJsApiLoader, StandaloneSearchBox } from '@react-google-maps/api';
import { MapPin, Loader2 } from 'lucide-react';

// Libraries to load for Google Maps
const libraries: ("places")[] = ['places'];

interface GooglePlacesAutocompleteProps {
    value: string;
    onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void;
    placeholder?: string;
    className?: string;
    types?: string[]; // e.g., ['address'], ['establishment'], ['(regions)']
    error?: string;
    disabled?: boolean;
    componentRestrictions?: { country: string | string[] };
}

// Singleton to track if API is loaded globally
let isApiLoaded = false;

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
    value,
    onChange,
    placeholder = 'Search for a location...',
    className = '',
    types,
    error,
    disabled = false,
    componentRestrictions = { country: 'ng' } // Default to Nigeria
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const searchBoxRef = useRef<google.maps.places.SearchBox | null>(null);
    const [inputValue, setInputValue] = useState(value);

    // Get API key from environment
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || '';

    // Load the Google Maps JavaScript API
    const { isLoaded, loadError } = useJsApiLoader({
        googleMapsApiKey: apiKey,
        libraries,
        // Prevent duplicate loading
        id: 'google-maps-script',
    });

    // Update local state when external value changes
    useEffect(() => {
        setInputValue(value);
    }, [value]);

    // Handle place selection
    const handlePlacesChanged = useCallback(() => {
        if (searchBoxRef.current) {
            const places = searchBoxRef.current.getPlaces();
            if (places && places.length > 0) {
                const place = places[0];
                const formattedAddress = place.formatted_address || place.name || '';
                setInputValue(formattedAddress);
                onChange(formattedAddress, place);
            }
        }
    }, [onChange]);

    // Handle manual input changes
    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        // Only update parent if user is typing, not selecting from dropdown
        onChange(newValue);
    };

    // Handle search box load
    const handleSearchBoxLoad = (ref: google.maps.places.SearchBox) => {
        searchBoxRef.current = ref;
    };

    // If no API key is configured, render a simple input
    if (!apiKey) {
        return (
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        onChange(e.target.value);
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full h-10 pl-10 pr-3 rounded-lg border font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${error ? 'border-red-500' : 'border-neutral-200'
                        } ${disabled ? 'bg-neutral-50 cursor-not-allowed' : ''} ${className}`}
                />
                {error && (
                    <p className="text-red-500 text-xs mt-1" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    // Loading state
    if (!isLoaded) {
        return (
            <div className="relative">
                <Loader2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" />
                <input
                    type="text"
                    value={inputValue}
                    onChange={handleInputChange}
                    placeholder="Loading Google Maps..."
                    disabled
                    className={`w-full h-10 pl-10 pr-3 rounded-lg border border-neutral-200 font-sans text-sm bg-neutral-50 cursor-not-allowed ${className}`}
                />
            </div>
        );
    }

    // Error loading Google Maps
    if (loadError) {
        console.error('Google Maps load error:', loadError);
        return (
            <div className="relative">
                <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
                <input
                    type="text"
                    value={inputValue}
                    onChange={(e) => {
                        setInputValue(e.target.value);
                        onChange(e.target.value);
                    }}
                    placeholder={placeholder}
                    disabled={disabled}
                    className={`w-full h-10 pl-10 pr-3 rounded-lg border font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${error ? 'border-red-500' : 'border-neutral-200'
                        } ${className}`}
                />
                <p className="text-amber-600 text-xs mt-1">
                    Google Maps unavailable. Enter address manually.
                </p>
                {error && (
                    <p className="text-red-500 text-xs mt-1" role="alert">
                        {error}
                    </p>
                )}
            </div>
        );
    }

    return (
        <div className="relative">
            <StandaloneSearchBox
                onLoad={handleSearchBoxLoad}
                onPlacesChanged={handlePlacesChanged}
            >
                <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 z-10" />
                    <input
                        ref={inputRef}
                        type="text"
                        value={inputValue}
                        onChange={handleInputChange}
                        placeholder={placeholder}
                        disabled={disabled}
                        className={`w-full h-10 pl-10 pr-3 rounded-lg border font-sans text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 ${error ? 'border-red-500' : 'border-neutral-200'
                            } ${disabled ? 'bg-neutral-50 cursor-not-allowed' : ''} ${className}`}
                    />
                </div>
            </StandaloneSearchBox>
            {error && (
                <p className="text-red-500 text-xs mt-1" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

export default GooglePlacesAutocomplete;
