export const AIRLINES = [
  { code: 'AA', name: 'American Airlines', logo: 'AA' },
  { code: 'DL', name: 'Delta Air Lines', logo: 'DL' },
  { code: 'UA', name: 'United Airlines', logo: 'UA' },
  { code: 'WN', name: 'Southwest Airlines', logo: 'WN' },
  { code: 'B6', name: 'JetBlue', logo: 'B6' },
  { code: 'AS', name: 'Alaska Airlines', logo: 'AS' },
] as const;

export const AIRPORTS = [
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles' },
  { code: 'ORD', name: "O'Hare International", city: 'Chicago' },
  { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas' },
  { code: 'MIA', name: 'Miami International', city: 'Miami' },
  { code: 'SEA', name: 'Seattle–Tacoma International', city: 'Seattle' },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta' },
  { code: 'DEN', name: 'Denver International', city: 'Denver' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco' },
  { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas' },
] as const;

export const DEFAULT_SEARCH_PARAMS = {
  origin: 'JFK',
  destination: 'LAX',
  departureDate: new Date(),
  returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
  passengers: {
    adults: 1,
    children: 0,
    infants: 0,
  },
} as const;

export const FILTER_DEFAULTS = {
  maxPrice: 1000,
  stops: [0, 1, 2],
  airlines: [],
  departureTimeRange: [0, 24] as [number, number],
} as const;

export const CURRENCIES = {
  USD: '$',
  EUR: '€',
  GBP: '£',
} as const;

export const TIME_FORMATS = {
  SHORT: 'h:mm a',
  LONG: 'EEEE, MMMM d, yyyy',
} as const;

// Add empty export to ensure it's treated as a module
export {};