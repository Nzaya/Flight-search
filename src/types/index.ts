export interface Flight {
  id: string;
  airline: string;
  airlineLogo: string;
  flightNumber: string;
  origin: string;
  destination: string;
  departureTime: string;
  arrivalTime: string;
  duration: number; // in minutes
  price: number;
  stops: number;
  stopDetails?: {
    airport: string;
    duration: number;
  }[];
  aircraft?: string;
}

export interface SearchParams {
  origin: string;
  destination: string;
  departureDate: Date;
  returnDate?: Date;
  passengers: {
    adults: number;
    children: number;
    infants: number;
  };
}

export interface FilterOptions {
  maxPrice: number;
  stops: number[];
  airlines: string[];
  departureTimeRange: [number, number]; // [startHour, endHour] 0-23
}

export interface PriceDataPoint {
  date: string;
  price: number;
  airline: string;
}

// NEW: Destination interface for Flight Inspiration API
export interface Destination {
  type: string;
  origin: string;
  destination: string;
  departureDate: string;
  returnDate: string;
  price: {
    total: string;
  };
  links: {
    flightDates: string;
    flightOffers: string;
  };
}