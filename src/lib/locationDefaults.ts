/**
 * Centralized default location values.
 *
 * These are fallback values used when a user/vendor has not provided a
 * location. They are intentionally Nigeria-centric because that is NIMEX's
 * initial operating market. Update these values (or load them from remote
 * config) when expanding to other countries.
 */

export const DEFAULT_COUNTRY = 'Nigeria';
export const DEFAULT_CITY = 'Lagos';
export const DEFAULT_STATE = 'Lagos';
export const DEFAULT_COORDINATES = { lat: 6.5244, lng: 3.3792 };
export const DEFAULT_COUNTRY_CENTER = { lat: 9.0820, lng: 8.6753 };
export const DEFAULT_LOCATION_LABEL = 'Lagos, Nigeria';

export const NIGERIAN_STATES = [
  'Abia', 'Adamawa', 'Akwa Ibom', 'Anambra', 'Bauchi', 'Bayelsa', 'Benue', 'Borno',
  'Cross River', 'Delta', 'Ebonyi', 'Edo', 'Ekiti', 'Enugu', 'FCT - Abuja', 'Gombe',
  'Imo', 'Jigawa', 'Kaduna', 'Kano', 'Katsina', 'Kebbi', 'Kogi', 'Kwara', 'Lagos',
  'Nasarawa', 'Niger', 'Ogun', 'Ondo', 'Osun', 'Oyo', 'Plateau', 'Rivers', 'Sokoto',
  'Taraba', 'Yobe', 'Zamfara'
];
