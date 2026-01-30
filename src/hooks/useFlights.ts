import { useState, useEffect, useCallback } from 'react';
import { Flight, SearchParams, FilterOptions } from '../types';
import { FlightAPI } from '../lib/api';

export const useFlights = () => {
  const [flights, setFlights] = useState<Flight[]>([]);
  const [filteredFlights, setFilteredFlights] = useState<Flight[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [searchParams, setSearchParams] = useState<SearchParams | null>(null);
  const [filters, setFilters] = useState<FilterOptions>({
    maxPrice: 1000,
    stops: [0, 1, 2],
    airlines: [],
    departureTimeRange: [0, 24]
  });

  const search = useCallback(async (params: SearchParams) => {
    console.log('🚀 Starting flight search...');
    setLoading(true);
    setError(null);
    setSearchParams(params);

    try {
      const results = await FlightAPI.searchFlights(params);
      console.log('🎉 Search completed, processing results');
      setFlights(results);
      applyFilters(results, filters);
    } catch (err) {
      console.error('❌ Search failed:', err);
      setError('Failed to search flights. Please try again.');
      setFlights([]);
      setFilteredFlights([]);
    } finally {
      setLoading(false);
    }
  }, [filters]);

  const applyFilters = useCallback((flightList: Flight[], filterOptions: FilterOptions) => {
    console.log('⚙️ Applying filters:', filterOptions);
    
    const filtered = flightList.filter(flight => {
      // Filter by price
      if (flight.price > filterOptions.maxPrice) return false;
      
      // Filter by stops
      if (!filterOptions.stops.includes(flight.stops)) return false;
      
      // Filter by airlines
      if (filterOptions.airlines.length > 0 && 
          !filterOptions.airlines.includes(flight.airline)) {
        return false;
      }
      
      // Filter by departure time
      const departureHour = parseInt(flight.departureTime.split(':')[0]);
      if (departureHour < filterOptions.departureTimeRange[0] || 
          departureHour > filterOptions.departureTimeRange[1]) {
        return false;
      }
      
      return true;
    });
    
    console.log(`📊 Filtered ${flightList.length} flights down to ${filtered.length}`);
    setFilteredFlights(filtered);
  }, []);

  useEffect(() => {
    if (flights.length > 0) {
      applyFilters(flights, filters);
    }
  }, [filters, flights, applyFilters]);

  const updateFilters = useCallback((newFilters: Partial<FilterOptions>) => {
    console.log('🔄 Updating filters:', newFilters);
    setFilters(prev => ({ ...prev, ...newFilters }));
  }, []);

  return {
    flights,
    filteredFlights,
    loading,
    error,
    search,
    searchParams,
    filters,
    updateFilters
  };
};