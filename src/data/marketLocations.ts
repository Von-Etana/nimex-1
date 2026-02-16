export interface MarketLocation {
  id: string;
  name: string;
  region: string;
  description?: string;
}

export const MARKET_LOCATIONS: MarketLocation[] = [
  // Lagos Markets
  { id: 'balogun', name: 'Balogun Market', region: 'Lagos Island', description: 'Historic market in Lagos Island' },
  { id: 'tejuosho', name: 'Tejuosho Market', region: 'Surulere', description: 'Popular market in Surulere' },
  { id: 'oshodi', name: 'Oshodi Market', region: 'Oshodi', description: 'Major transportation and commercial hub' },
  { id: 'lekki', name: 'Lekki Market', region: 'Lekki', description: 'Modern market in Lekki Phase 1' },
  { id: 'ikeja', name: 'Ikeja City Mall', region: 'Ikeja', description: 'Modern shopping mall in Ikeja' },
  { id: 'computer_village', name: 'Computer Village', region: 'Ikeja', description: 'Tech and electronics hub' },
  { id: 'mile12', name: 'Mile 12 Market', region: 'Ikeja', description: 'Large market complex' },
  { id: 'ketu', name: 'Ketu Market', region: 'Ketu', description: 'Popular market in Ketu area' },
  { id: 'ajah', name: 'Ajah Market', region: 'Ajah', description: 'Growing market in Ajah' },
  { id: 'festac', name: 'Festac Market', region: 'Festac', description: 'Market in Festac Town' },

  // Abuja Markets
  { id: 'garki', name: 'Garki Market', region: 'Garki', description: 'Central market in Garki' },
  { id: 'wuse', name: 'Wuse Market', region: 'Wuse', description: 'Market in Wuse district' },
  { id: 'kuje', name: 'Kuje Market', region: 'Kuje', description: 'Market in Kuje area' },
  { id: 'dutse', name: 'Dutse Market', region: 'Dutse', description: 'Market in Dutse Alhaji' },
  { id: 'kubwa', name: 'Kubwa Market', region: 'Kubwa', description: 'Market in Kubwa' },
  { id: 'nyanya', name: 'Nyanya Market', region: 'Nyanya', description: 'Market in Nyanya' },

  // Port Harcourt Markets
  { id: 'mile1', name: 'Mile 1 Market', region: 'Port Harcourt', description: 'Popular market in Mile 1' },
  { id: 'mile3', name: 'Mile 3 Market', region: 'Port Harcourt', description: 'Market in Mile 3' },
  { id: 'trans_amadi', name: 'Trans Amadi Market', region: 'Port Harcourt', description: 'Market in Trans Amadi' },

  // Kano Markets
  { id: 'kano_main', name: 'Kano Main Market', region: 'Kano', description: 'Main market in Kano' },
  { id: 'kofar_wambai', name: 'Kofar Wambai Market', region: 'Kano', description: 'Historic market in Kano' },

  // Ibadan Markets
  { id: 'bodija', name: 'Bodija Market', region: 'Ibadan', description: 'Market in Bodija area' },
  { id: 'challenge', name: 'Challenge Market', region: 'Ibadan', description: 'Popular market in Ibadan' },

  // Other Major Cities
  { id: 'onitsha_main', name: 'Onitsha Main Market', region: 'Onitsha', description: 'Major market in Onitsha' },
  { id: 'abia', name: 'Abia Market', region: 'Aba', description: 'Market in Aba' },
  { id: 'enugu', name: 'Enugu Market', region: 'Enugu', description: 'Market in Enugu' },
  { id: 'benin', name: 'Benin Market', region: 'Benin City', description: 'Market in Benin City' },
  { id: 'warri', name: 'Warri Market', region: 'Warri', description: 'Market in Warri' }
];

export const getMarketLocationById = (id: string): MarketLocation | undefined => {
  return MARKET_LOCATIONS.find(location => location.id === id);
};

export const getMarketLocationsByRegion = (region: string): MarketLocation[] => {
  return MARKET_LOCATIONS.filter(location => location.region === region);
};

export const searchMarketLocations = (query: string): MarketLocation[] => {
  const lowercaseQuery = query.toLowerCase();
  return MARKET_LOCATIONS.filter(location =>
    location.name.toLowerCase().includes(lowercaseQuery) ||
    location.region.toLowerCase().includes(lowercaseQuery) ||
    (location.description && location.description.toLowerCase().includes(lowercaseQuery))
  );
};