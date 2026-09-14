import { searchPlaces, geocodeAddress, getDistanceMatrix, getAutocompleteSuggestions } from '../googleMaps';

// Mock firebase-functions before importing googleMaps
jest.mock('firebase-functions', () => ({
  https: {
    HttpsError: class extends Error {
      constructor(public code: string, message: string) {
        super(message);
      }
    },
    onCall: (handler: any) => handler,
  },
  config: jest.fn().mockReturnValue({}),
}));

jest.mock('axios');
import axios from 'axios';
const mockedAxios = axios as jest.Mocked<typeof axios>;

const makeRequest = (data: any, auth = { uid: 'user1' }, app = { appId: 'app1' }) => ({
  data,
  auth,
  app,
});

// Cast onCall-exported handlers to async-callable functions returning the data shape
const call = (fn: any, req: any) => (fn as any)(req);

// Helper to set/unset the Google Maps key before/after each test
const withKey = async (fn: () => Promise<void>) => {
  process.env.GOOGLE_MAPS_API_KEY = 'test-key';
  try {
    await fn();
  } finally {
    process.env.GOOGLE_MAPS_API_KEY = 'test-key';
  }
};

describe('googleMaps Cloud Functions', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    process.env.GOOGLE_MAPS_API_KEY = 'test-key';
  });

  afterEach(() => {
    delete process.env.GOOGLE_MAPS_API_KEY;
  });

  describe('searchPlaces', () => {
    it('returns results for a valid query', async () => {
      await withKey(async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: { status: 'OK', results: [{ place_id: '1', name: 'Lagos Island' }] },
        });

        const result = await call(searchPlaces, makeRequest({ query: 'Lagos' }));
        expect(result.results).toHaveLength(1);
        expect(mockedAxios.get).toHaveBeenCalledWith(
          expect.stringContaining('maps.googleapis.com/maps/api/place/textsearch/json')
        );
      });
    });

    it('rejects when query is missing', async () => {
      await withKey(async () => {
        await expect(call(searchPlaces, makeRequest({}))).rejects.toThrow('query is required');
      });
    });

    it('rejects when API returns an error', async () => {
      await withKey(async () => {
        mockedAxios.get.mockResolvedValueOnce({ data: { status: 'REQUEST_DENIED' } });
        await expect(call(searchPlaces, makeRequest({ query: 'Lagos' }))).rejects.toThrow('Location service unavailable');
      });
    });
  });

  describe('geocodeAddress', () => {
    it('returns geocoded results', async () => {
      await withKey(async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: {
            status: 'OK',
            results: [{
              place_id: '1',
              formatted_address: 'Ikeja, Lagos, Nigeria',
              geometry: { location: { lat: 6.5244, lng: 3.3792 } },
              types: ['locality'],
            }],
          },
        });

        const result = await call(geocodeAddress, makeRequest({ address: 'Ikeja Lagos' }));
        expect(result.results[0].formatted_address).toBe('Ikeja, Lagos, Nigeria');
      });
    });
  });

  describe('getDistanceMatrix', () => {
    it('returns distance matrix data', async () => {
      await withKey(async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: { status: 'OK', rows: [] },
        });

        const result = await call(getDistanceMatrix, makeRequest({
          origins: [{ lat: 6.5, lng: 3.4 }],
          destinations: [{ lat: 6.6, lng: 3.5 }],
        }));
        expect(result.status).toBe('OK');
      });
    });

    it('rejects when origins/destinations are missing', async () => {
      await withKey(async () => {
        await expect(call(getDistanceMatrix, makeRequest({}))).rejects.toThrow('origins and destinations arrays are required');
      });
    });
  });

  describe('getAutocompleteSuggestions', () => {
    it('returns prediction descriptions', async () => {
      await withKey(async () => {
        mockedAxios.get.mockResolvedValueOnce({
          data: { status: 'OK', predictions: [{ description: 'Yaba, Lagos' }] },
        });

        const result = await call(getAutocompleteSuggestions, makeRequest({ input: 'Yaba' }));
        expect(result.predictions).toEqual(['Yaba, Lagos']);
      });
    });
  });
});
