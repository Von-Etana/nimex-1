import React, { useRef, useEffect, useState, useCallback } from 'react';
import { MapPin, Loader2 } from 'lucide-react';
import { googleMapsService } from '../../services/googleMapsService';
import { DEFAULT_COUNTRY } from '../../lib/locationDefaults';

interface GooglePlacesAutocompleteProps {
    value: string;
    onChange: (value: string, placeDetails?: google.maps.places.PlaceResult) => void;
    placeholder?: string;
    className?: string;
    types?: string[];
    error?: string;
    disabled?: boolean;
    componentRestrictions?: { country: string | string[] };
}

export const GooglePlacesAutocomplete: React.FC<GooglePlacesAutocompleteProps> = ({
    value,
    onChange,
    placeholder = 'Search for a location...',
    className = '',
    error,
    disabled = false,
}) => {
    const inputRef = useRef<HTMLInputElement>(null);
    const [inputValue, setInputValue] = useState(value);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setInputValue(value);
    }, [value]);

    useEffect(() => {
        const handleClickOutside = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setShowSuggestions(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    const fetchSuggestions = useCallback(async (query: string) => {
        if (query.length < 3) {
            setSuggestions([]);
            setShowSuggestions(false);
            return;
        }
        setIsLoading(true);
        try {
            const results = await googleMapsService.getAutocompleteSuggestions(query);
            setSuggestions(results.slice(0, 5));
            setShowSuggestions(results.length > 0);
        } catch (err) {
            console.error('Autocomplete error:', err);
            setSuggestions([]);
            setShowSuggestions(false);
        } finally {
            setIsLoading(false);
        }
    }, []);

    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const newValue = e.target.value;
        setInputValue(newValue);
        onChange(newValue);

        if (debounceRef.current) clearTimeout(debounceRef.current);
        debounceRef.current = setTimeout(() => fetchSuggestions(newValue), 300);
    };

    const handleSelect = async (suggestion: string) => {
        setInputValue(suggestion);
        setShowSuggestions(false);

        // Try to enrich with place details for callers that need lat/lng
        try {
            const places = await googleMapsService.geocodeAddress(suggestion);
            if (places.length > 0) {
                onChange(suggestion, places[0] as unknown as google.maps.places.PlaceResult);
                return;
            }
        } catch (err) {
            console.warn('Could not geocode selected suggestion:', err);
        }
        onChange(suggestion);
    };

    return (
        <div ref={wrapperRef} className="relative">
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
                {isLoading && (
                    <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400 animate-spin" aria-hidden="true" />
                )}
            </div>

            {showSuggestions && (
                <ul className="absolute z-20 w-full bg-white border border-neutral-200 rounded-lg shadow-lg mt-1 max-h-60 overflow-auto">
                    {suggestions.map((suggestion, index) => (
                        <li
                            key={index}
                            onClick={() => handleSelect(suggestion)}
                            className="px-4 py-2 hover:bg-neutral-50 cursor-pointer font-sans text-sm text-neutral-700"
                        >
                            {suggestion}
                        </li>
                    ))}
                </ul>
            )}

            {error && (
                <p className="text-red-500 text-xs mt-1" role="alert">
                    {error}
                </p>
            )}
        </div>
    );
};

export default GooglePlacesAutocomplete;
