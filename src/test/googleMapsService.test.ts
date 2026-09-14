import { describe, it, expect, vi, beforeEach } from 'vitest';
import { googleMapsService } from '../services/googleMapsService';

const mockCallable = vi.fn();
vi.mock('../lib/firebase', () => ({
  functions: {},
  httpsCallable: () => mockCallable,
}));

describe('googleMapsService', () => {
  beforeEach(() => {
    mockCallable.mockReset();
  });

  it('proxies searchPlaces through Cloud Functions', async () => {
    mockCallable.mockResolvedValueOnce({ data: { results: [{ place_id: '1', formatted_address: 'Lagos', geometry: { location: { lat: 1, lng: 2 } }, name: 'Lagos', types: ['locality'] }] } });
    const results = await googleMapsService.searchPlaces('Lagos');
    expect(mockCallable).toHaveBeenCalledWith({ query: 'Lagos', location: undefined, radius: 50000 });
    expect(results[0].place_id).toBe('1');
  });

  it('proxies geocodeAddress through Cloud Functions', async () => {
    mockCallable.mockResolvedValueOnce({ data: { results: [{ place_id: '2', formatted_address: 'Abuja', geometry: { location: { lat: 3, lng: 4 } }, name: 'Abuja', types: ['locality'] }] } });
    const results = await googleMapsService.geocodeAddress('Abuja');
    expect(mockCallable).toHaveBeenCalledWith({ address: 'Abuja' });
    expect(results[0].place_id).toBe('2');
  });

  it('proxies getDistanceMatrix through Cloud Functions', async () => {
    const matrix = { destination_addresses: ['Lagos'], origin_addresses: ['Abuja'], rows: [{ elements: [{ distance: { text: '1 km', value: 1000 }, duration: { text: '1 min', value: 60 }, status: 'OK' }] }], status: 'OK' };
    mockCallable.mockResolvedValueOnce({ data: matrix });
    const result = await googleMapsService.getDistanceMatrix([{ lat: 1, lng: 2 }], [{ lat: 3, lng: 4 }]);
    expect(mockCallable).toHaveBeenCalledWith({ origins: [{ lat: 1, lng: 2 }], destinations: [{ lat: 3, lng: 4 }] });
    expect(result.status).toBe('OK');
  });

  it('throws on callable failure', async () => {
    mockCallable.mockRejectedValueOnce(new Error('network error'));
    await expect(googleMapsService.searchPlaces('Lagos')).rejects.toThrow('Location service unavailable');
  });
});
