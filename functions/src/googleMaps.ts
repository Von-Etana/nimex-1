import * as functions from "firebase-functions";
import axios from "axios";

/**
 * Server-side Google Maps proxy.
 *
 * The browser no longer calls the Google Places / Geocoding / Distance Matrix
 * APIs directly, so the Google Maps API key is not exposed in the client bundle.
 * All requests are authenticated via Firebase Auth and verified via App Check.
 */

const getGoogleMapsApiKey = () =>
  process.env.GOOGLE_MAPS_API_KEY ||
  ((functions as any).config?.() ?? {}).googlemaps?.api_key ||
  ((functions as any).config?.() ?? {}).google_maps?.api_key;

interface LatLng {
  lat: number;
  lng: number;
}

const httpsError = (code: functions.https.FunctionsErrorCode, message: string) => {
  throw new functions.https.HttpsError(code, message);
};

const requireAuthAndAppCheck = (request: functions.https.CallableRequest) => {
  if (!request.app) {
    httpsError("failed-precondition", "The function must be called from an App Check verified app.");
  }
  if (!request.auth) {
    httpsError("unauthenticated", "Authentication required.");
  }
  const key = getGoogleMapsApiKey();
  if (!key) {
    httpsError("failed-precondition", "Google Maps is not configured on the server.");
  }
  return key;
};

/**
 * Search places using text query.
 * Body: { query: string, location?: { lat, lng }, radius?: number }
 */
export const searchPlaces = functions.https.onCall(async (request: functions.https.CallableRequest) => {
  const key = requireAuthAndAppCheck(request);
  const { query, location, radius = 50000 } = request.data || {};
  if (!query || typeof query !== "string") {
    httpsError("invalid-argument", "query is required");
  }

  const params = new URLSearchParams({
    key: key as string,
    query,
    fields: "place_id,formatted_address,geometry,name,types",
  });
  if (location?.lat != null && location?.lng != null) {
    params.append("location", `${location.lat},${location.lng}`);
    params.append("radius", String(radius));
  }

  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/place/textsearch/json?${params.toString()}`);
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("Google Places textsearch error:", data.status, data.error_message);
    httpsError("internal", "Location service unavailable");
  }
  return { results: data.results || [] };
});

/**
 * Get place details by place ID.
 * Body: { placeId: string }
 */
export const getPlaceDetails = functions.https.onCall(async (request: functions.https.CallableRequest) => {
  const key = requireAuthAndAppCheck(request);
  const { placeId } = request.data || {};
  if (!placeId || typeof placeId !== "string") {
    httpsError("invalid-argument", "placeId is required");
  }

  const params = new URLSearchParams({
    key: key as string,
    place_id: placeId,
    fields: "place_id,formatted_address,geometry,name,types",
  });

  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/place/details/json?${params.toString()}`);
  if (data.status !== "OK") {
    console.error("Google Places details error:", data.status, data.error_message);
    httpsError("internal", "Location service unavailable");
  }
  return { result: data.result || null };
});

/**
 * Geocode an address to coordinates.
 * Body: { address: string }
 */
export const geocodeAddress = functions.https.onCall(async (request: functions.https.CallableRequest) => {
  const key = requireAuthAndAppCheck(request);
  const { address } = request.data || {};
  if (!address || typeof address !== "string") {
    httpsError("invalid-argument", "address is required");
  }

  const params = new URLSearchParams({
    key: key as string,
    address,
  });

  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/geocode/json?${params.toString()}`);
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("Google Geocoding error:", data.status, data.error_message);
    httpsError("internal", "Location service unavailable");
  }

  const results = (data.results || []).map((result: any) => ({
    place_id: result.place_id,
    formatted_address: result.formatted_address,
    geometry: result.geometry,
    name: result.formatted_address,
    types: result.types || [],
  }));
  return { results };
});

/**
 * Calculate distance and duration between origins and destinations.
 * Body: { origins: [{lat,lng}], destinations: [{lat,lng}] }
 */
export const getDistanceMatrix = functions.https.onCall(async (request: functions.https.CallableRequest) => {
  const key = requireAuthAndAppCheck(request);
  const { origins, destinations } = request.data || {};
  if (!Array.isArray(origins) || !Array.isArray(destinations) || origins.length === 0 || destinations.length === 0) {
    httpsError("invalid-argument", "origins and destinations arrays are required");
  }

  const originStrings = origins.map((o: LatLng) => `${o.lat},${o.lng}`).join("|");
  const destinationStrings = destinations.map((d: LatLng) => `${d.lat},${d.lng}`).join("|");

  const params = new URLSearchParams({
    key: key as string,
    origins: originStrings,
    destinations: destinationStrings,
    units: "metric",
  });

  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/distancematrix/json?${params.toString()}`);
  if (data.status !== "OK") {
    console.error("Google Distance Matrix error:", data.status, data.error_message);
    httpsError("internal", "Location service unavailable");
  }
  return data;
});

/**
 * Get autocomplete suggestions restricted to Nigeria.
 * Body: { input: string, location?: {lat,lng}, radius?: number }
 */
export const getAutocompleteSuggestions = functions.https.onCall(async (request: functions.https.CallableRequest) => {
  const key = requireAuthAndAppCheck(request);
  const { input, location, radius = 50000 } = request.data || {};
  if (!input || typeof input !== "string") {
    httpsError("invalid-argument", "input is required");
  }

  const params = new URLSearchParams({
    key: key as string,
    input,
    types: "(cities)",
    components: "country:ng",
  });
  if (location?.lat != null && location?.lng != null) {
    params.append("location", `${location.lat},${location.lng}`);
    params.append("radius", String(radius));
  }

  const { data } = await axios.get(`https://maps.googleapis.com/maps/api/place/autocomplete/json?${params.toString()}`);
  if (data.status !== "OK" && data.status !== "ZERO_RESULTS") {
    console.error("Google Autocomplete error:", data.status, data.error_message);
    httpsError("internal", "Location service unavailable");
  }
  return { predictions: (data.predictions || []).map((p: any) => p.description) };
});
