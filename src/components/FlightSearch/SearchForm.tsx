import React, { useState, useEffect, useCallback } from 'react';
import { CalendarDays, Users, Search as SearchIcon, ChevronDown, Plane, MapPin, Loader2 } from 'lucide-react';
import { Button } from '../ui/button';
import { SearchParams } from '../../types';
import { FlightAPI } from '../../lib/api';
import { debounce } from 'lodash';

interface Airport {
  code: string;
  name: string;
  city: string;
}

interface SearchFormProps {
  onSubmit: (params: SearchParams) => void;
  loading?: boolean;
  onOriginChange?: (origin: string) => void; // NEW prop
}

// Fallback mock airport data - used when API is not available
const FALLBACK_AIRPORTS: Airport[] = [
  { code: 'JFK', name: 'John F. Kennedy International', city: 'New York' },
  { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles' },
  { code: 'ORD', name: "O'Hare International", city: 'Chicago' },
  { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas' },
  { code: 'MIA', name: 'Miami International', city: 'Miami' },
  { code: 'SEA', name: 'Seattle–Tacoma International', city: 'Seattle' },
  { code: 'ATL', name: 'Hartsfield-Jackson Atlanta', city: 'Atlanta' },
  { code: 'DEN', name: 'Denver International', city: 'Denver' },
  { code: 'SFO', name: 'San Francisco International', city: 'San Francisco' },
  { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas' },
  { code: 'BOS', name: 'Logan International', city: 'Boston' },
  { code: 'PHX', name: 'Phoenix Sky Harbor', city: 'Phoenix' },
];

export const SearchForm: React.FC<SearchFormProps> = ({ onSubmit, loading, onOriginChange }) => {
  // Form state
  const [form, setForm] = useState({
    origin: 'JFK',
    destination: 'LAX',
    departureDate: new Date(),
    returnDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    passengers: {
      adults: 1,
      children: 0,
      infants: 0
    },
    tripType: 'one-way' as 'one-way' | 'round-trip'
  });

  // UI state
  const [showOriginDropdown, setShowOriginDropdown] = useState(false);
  const [showDestinationDropdown, setShowDestinationDropdown] = useState(false);
  const [searchQuery, setSearchQuery] = useState({ origin: '', destination: '' });
  
  // Airport data state
  const [originSuggestions, setOriginSuggestions] = useState<Airport[]>([]);
  const [destinationSuggestions, setDestinationSuggestions] = useState<Airport[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState({ origin: false, destination: false });
  const [usingAPISuggestions, setUsingAPISuggestions] = useState({ origin: false, destination: false });

  // Get selected airport details
  const selectedOrigin = [...FALLBACK_AIRPORTS, ...originSuggestions].find(a => a.code === form.origin);
  const selectedDestination = [...FALLBACK_AIRPORTS, ...destinationSuggestions].find(a => a.code === form.destination);

  /**
   * Handle form submission
   */
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.group('📝 SearchForm Submission');
    console.log('✅ Form submitted with values:', {
      origin: form.origin,
      destination: form.destination,
      departureDate: form.departureDate.toISOString().split('T')[0],
      returnDate: form.returnDate?.toISOString().split('T')[0],
      passengers: form.passengers,
      tripType: form.tripType,
    });
    
    const params: SearchParams = {
      origin: form.origin,
      destination: form.destination,
      departureDate: form.departureDate,
      passengers: form.passengers
    };
    
    if (form.tripType === 'round-trip') {
      params.returnDate = form.returnDate;
    }
    
    console.log('🚀 Passing search params to parent component');
    console.groupEnd();
    
    onSubmit(params);
  };

  /**
   * Handle airport selection from dropdown
   */
  const handleAirportSelect = (code: string, type: 'origin' | 'destination') => {
    console.log(`📍 Selected ${type} airport: ${code}`);
    
    if (type === 'origin') {
      setForm({...form, origin: code});
      setShowOriginDropdown(false);
      setSearchQuery(prev => ({...prev, origin: ''}));
      setOriginSuggestions([]);
      
      // NEW: Notify parent about origin change
      if (onOriginChange) {
        onOriginChange(code);
      }
    } else {
      setForm({...form, destination: code});
      setShowDestinationDropdown(false);
      setSearchQuery(prev => ({...prev, destination: ''}));
      setDestinationSuggestions([]);
    }
  };

  /**
   * Swap origin and destination airports
   */
  const swapAirports = () => {
    console.log('🔄 Swapping origin and destination airports');
    const newOrigin = form.destination;
    const newDestination = form.origin;
    
    setForm({
      ...form,
      origin: newOrigin,
      destination: newDestination
    });
    
    // NEW: Notify parent about origin change after swap
    if (onOriginChange) {
      onOriginChange(newOrigin);
    }
  };

  /**
   * Search for airports using API with fallback
   */
  const searchAirports = useCallback(
  debounce(async (query: string, type: 'origin' | 'destination') => {
    console.group(`🔍 Airport Search (${type})`);
    console.log(`📋 Search query: "${query}"`);

    if (query.length < 2) {
      console.log('⚠️ Query too short, clearing suggestions');
      if (type === 'origin') {
        setOriginSuggestions([]);
        setUsingAPISuggestions(prev => ({ ...prev, origin: false }));
      } else {
        setDestinationSuggestions([]);
        setUsingAPISuggestions(prev => ({ ...prev, destination: false }));
      }
      console.groupEnd();
      return;
    }

    // Set loading state
    if (type === 'origin') {
      setIsLoadingSuggestions(prev => ({ ...prev, origin: true }));
    } else {
      setIsLoadingSuggestions(prev => ({ ...prev, destination: true }));
    }

    try {
      console.log('🌐 Attempting to fetch airport suggestions from API...');
      const suggestions = await FlightAPI.getAirportSuggestions(query);

      if (type === 'origin') {
        setUsingAPISuggestions(prev => ({ ...prev, origin: true }));
        setOriginSuggestions(suggestions);
        console.log(`✅ Received ${suggestions.length} API suggestions for origin`);
      } else {
        setUsingAPISuggestions(prev => ({ ...prev, destination: true }));
        setDestinationSuggestions(suggestions);
        console.log(`✅ Received ${suggestions.length} API suggestions for destination`);
      }

      // Log API/mode status
      if (suggestions.length > 0) {
        console.log('📡 Using data from: API');
      } else {
        console.log('🎭 Using data from: Mock (no API results)');
      }

    } catch (error) {
      console.warn(`⚠️ API search failed for "${query}", using fallback data`);

      // Fallback to local filtering if API fails
      const fallbackResults = FALLBACK_AIRPORTS.filter(airport =>
        airport.code.toLowerCase().includes(query.toLowerCase()) ||
        airport.city.toLowerCase().includes(query.toLowerCase()) ||
        airport.name.toLowerCase().includes(query.toLowerCase())
      ).slice(0, 5);

      if (type === 'origin') {
        setUsingAPISuggestions(prev => ({ ...prev, origin: false }));
        setOriginSuggestions(fallbackResults);
        console.log(`🔄 Using ${fallbackResults.length} fallback suggestions for origin`);
      } else {
        setUsingAPISuggestions(prev => ({ ...prev, destination: false }));
        setDestinationSuggestions(fallbackResults);
        console.log(`🔄 Using ${fallbackResults.length} fallback suggestions for destination`);
      }
    } finally {
      // Clear loading state
      if (type === 'origin') {
        setIsLoadingSuggestions(prev => ({ ...prev, origin: false }));
      } else {
        setIsLoadingSuggestions(prev => ({ ...prev, destination: false }));
      }
      console.groupEnd();
    }
  }, 300),
  [
    setOriginSuggestions,
    setDestinationSuggestions,
    setIsLoadingSuggestions,
    setUsingAPISuggestions
  ]
);


  /**
   * Handle search input changes
   */
  const handleOriginSearch = (query: string) => {
    setSearchQuery(prev => ({...prev, origin: query}));
    searchAirports(query, 'origin');
  };

  const handleDestinationSearch = (query: string) => {
    setSearchQuery(prev => ({...prev, destination: query}));
    searchAirports(query, 'destination');
  };

  /**
   * Get airports to display in dropdown
   */
  const getOriginAirports = () => {
    // If we have search query, show suggestions
    if (searchQuery.origin.length >= 2) {
      return originSuggestions;
    }
    // Otherwise show popular airports
    return FALLBACK_AIRPORTS.filter(airport => 
      !searchQuery.origin || 
      airport.code.toLowerCase().includes(searchQuery.origin.toLowerCase()) ||
      airport.city.toLowerCase().includes(searchQuery.origin.toLowerCase())
    ).slice(0, 8);
  };

  const getDestinationAirports = () => {
    // If we have search query, show suggestions
    if (searchQuery.destination.length >= 2) {
      return destinationSuggestions;
    }
    // Otherwise show popular airports
    return FALLBACK_AIRPORTS.filter(airport => 
      !searchQuery.destination || 
      airport.code.toLowerCase().includes(searchQuery.destination.toLowerCase()) ||
      airport.city.toLowerCase().includes(searchQuery.destination.toLowerCase())
    ).slice(0, 8);
  };

  /**
   * Close dropdowns when clicking outside
   */
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.origin-dropdown') && !target.closest('.destination-dropdown')) {
        setShowOriginDropdown(false);
        setShowDestinationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  /**
   * Render airport list item
   */
  const renderAirportItem = (airport: Airport, type: 'origin' | 'destination', isSelected: boolean) => (
    <button
      key={airport.code}
      type="button"
      onClick={() => handleAirportSelect(airport.code, type)}
      className={`w-full px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 transition-colors ${
        isSelected ? 'bg-primary/5 border-l-4 border-primary' : ''
      }`}
    >
      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
        isSelected ? 'bg-primary/20' : 'bg-gray-100'
      }`}>
        {type === 'origin' ? (
          <Plane className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-gray-600'}`} />
        ) : (
          <MapPin className={`w-5 h-5 ${isSelected ? 'text-primary' : 'text-gray-600'}`} />
        )}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className={`font-semibold ${isSelected ? 'text-primary' : 'text-gray-900'}`}>
            {airport.code}
          </span>
          <span className="text-sm text-gray-500">•</span>
          <span className="text-sm text-gray-600 truncate">{airport.city}</span>
          {usingAPISuggestions[type] && (
            <span className="text-xs px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full">
              API
            </span>
          )}
        </div>
        <div className="text-sm text-gray-500 truncate mt-1">{airport.name}</div>
      </div>
    </button>
  );

  /**
   * Render dropdown content
   */
  const renderDropdownContent = (
    type: 'origin' | 'destination',
    query: string,
    isLoading: boolean,
    airports: Airport[],
    selectedCode: string
  ) => (
    <>
      <div className="p-2 border-b">
        <input
          type="text"
          value={query}
          onChange={(e) => type === 'origin' ? handleOriginSearch(e.target.value) : handleDestinationSearch(e.target.value)}
          placeholder="Search by airport code, city, or name..."
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-2 focus:ring-primary focus:border-transparent"
          onClick={(e) => e.stopPropagation()}
          autoFocus
        />
        <div className="mt-1 text-xs text-gray-500">
          {searchQuery[type].length < 2 ? 'Type 2+ characters to search' : 'Searching airports...'}
        </div>
      </div>
      
      <div className="py-1 max-h-64 overflow-y-auto">
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-8">
            <Loader2 className="w-8 h-8 text-primary animate-spin mb-3" />
            <div className="text-sm text-gray-600">Searching airports...</div>
            <div className="text-xs text-gray-500 mt-1">Checking API and fallback options</div>
          </div>
        ) : airports.length > 0 ? (
          <>
            <div className="px-3 py-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
              {query.length >= 2 ? 'Search Results' : 'Popular Airports'}
              <span className="ml-2 text-xs text-gray-400">
                ({airports.length} found)
              </span>
            </div>
            {airports.map(airport => 
              renderAirportItem(airport, type, selectedCode === airport.code)
            )}
          </>
        ) : query.length >= 2 ? (
          <div className="px-4 py-8 text-center">
            <div className="text-gray-400 mb-2">✈️</div>
            <div className="text-gray-600 font-medium mb-1">No airports found</div>
            <div className="text-sm text-gray-500">
              Try a different search term or check your connection
            </div>
          </div>
        ) : (
          <div className="px-4 py-8 text-center">
            <div className="text-gray-400 mb-2">🔍</div>
            <div className="text-gray-600 font-medium mb-1">Search for airports</div>
            <div className="text-sm text-gray-500">
              Type airport code, city, or name above
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <form 
      onSubmit={handleSubmit} 
      className="bg-white rounded-2xl shadow-lg p-6 space-y-6"
    >
      <div className="flex flex-col md:flex-row gap-4">
        {/* Trip Type */}
        <div className="flex gap-2 p-1 bg-gray-100 rounded-lg">
          <button
            type="button"
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              form.tripType === 'one-way' 
                ? 'bg-white shadow-sm text-primary' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => {
              console.log('🔄 Changed trip type to: One-way');
              setForm({...form, tripType: 'one-way'});
            }}
          >
            One Way
          </button>
          <button
            type="button"
            className={`flex-1 px-4 py-2 rounded-md text-sm font-medium transition-colors ${
              form.tripType === 'round-trip' 
                ? 'bg-white shadow-sm text-primary' 
                : 'text-gray-600 hover:text-gray-900'
            }`}
            onClick={() => {
              console.log('🔄 Changed trip type to: Round-trip');
              setForm({...form, tripType: 'round-trip'});
            }}
          >
            Round Trip
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Origin Airport Dropdown */}
        <div className="space-y-2 relative origin-dropdown">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Plane className="w-4 h-4" />
            From
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                console.log('📋 Opening origin airport dropdown');
                setShowOriginDropdown(!showOriginDropdown);
                setShowDestinationDropdown(false);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{selectedOrigin?.code || 'Select airport'}</span>
                <span className="text-sm text-gray-500 truncate">
                  {selectedOrigin ? `${selectedOrigin.city} • ${selectedOrigin.name}` : 'Choose departure airport'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showOriginDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showOriginDropdown && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
                {renderDropdownContent(
                  'origin',
                  searchQuery.origin,
                  isLoadingSuggestions.origin,
                  getOriginAirports(),
                  form.origin
                )}
              </div>
            )}
          </div>
        </div>

        {/* Swap Button */}
        <div className="flex items-end justify-center pb-2">
          <button
            type="button"
            onClick={swapAirports}
            className="w-10 h-10 border border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors hover:scale-105 active:scale-95"
            title="Swap airports"
            aria-label="Swap origin and destination airports"
          >
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
            </svg>
          </button>
        </div>

        {/* Destination Airport Dropdown */}
        <div className="space-y-2 relative destination-dropdown">
          <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <MapPin className="w-4 h-4" />
            To
          </label>
          <div className="relative">
            <button
              type="button"
              onClick={() => {
                console.log('📋 Opening destination airport dropdown');
                setShowDestinationDropdown(!showDestinationDropdown);
                setShowOriginDropdown(false);
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent text-left flex items-center justify-between hover:bg-gray-50 transition-colors"
            >
              <div className="flex flex-col">
                <span className="font-medium text-gray-900">{selectedDestination?.code || 'Select airport'}</span>
                <span className="text-sm text-gray-500 truncate">
                  {selectedDestination ? `${selectedDestination.city} • ${selectedDestination.name}` : 'Choose arrival airport'}
                </span>
              </div>
              <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${showDestinationDropdown ? 'rotate-180' : ''}`} />
            </button>
            
            {showDestinationDropdown && (
              <div className="absolute z-20 mt-1 w-full bg-white border border-gray-200 rounded-lg shadow-xl max-h-96 overflow-hidden">
                {renderDropdownContent(
                  'destination',
                  searchQuery.destination,
                  isLoadingSuggestions.destination,
                  getDestinationAirports(),
                  form.destination
                )}
              </div>
            )}
          </div>
        </div>

        {/* Dates and Passengers Section */}
        <div className="md:col-span-3 grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Departure Date */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <CalendarDays className="w-4 h-4" />
              Departure
            </label>
            <input
              type="date"
              value={form.departureDate.toISOString().split('T')[0]}
              onChange={(e) => {
                const newDate = new Date(e.target.value);
                console.log('📅 Changed departure date to:', newDate.toISOString().split('T')[0]);
                setForm({...form, departureDate: newDate});
              }}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Return Date (only shown for round trip) */}
          {form.tripType === 'round-trip' && (
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Return</label>
              <input
                type="date"
                value={form.returnDate.toISOString().split('T')[0]}
                onChange={(e) => {
                  const newDate = new Date(e.target.value);
                  console.log('📅 Changed return date to:', newDate.toISOString().split('T')[0]);
                  setForm({...form, returnDate: newDate});
                }}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent"
                min={form.departureDate.toISOString().split('T')[0]}
              />
            </div>
          )}

          {/* Passengers */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <Users className="w-4 h-4" />
              Passengers
            </label>
            <button
              type="button"
              className="w-full px-4 py-3 border border-gray-300 rounded-lg text-left hover:bg-gray-50 transition-colors"
              onClick={() => {
                console.log('👥 Opening passenger selector');
                // TODO: Implement passenger selector modal
              }}
            >
              <div className="flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-gray-900">
                    {form.passengers.adults + form.passengers.children + form.passengers.infants} passenger(s)
                  </span>
                  <span className="text-xs text-gray-500">
                    {form.passengers.adults} adult{form.passengers.adults !== 1 ? 's' : ''}
                    {form.passengers.children > 0 && `, ${form.passengers.children} child${form.passengers.children !== 1 ? 'ren' : ''}`}
                    {form.passengers.infants > 0 && `, ${form.passengers.infants} infant${form.passengers.infants !== 1 ? 's' : ''}`}
                  </span>
                </div>
                <ChevronDown className="w-4 h-4 text-gray-400" />
              </div>
            </button>
          </div>
        </div>
      </div>

      <div className="flex justify-center pt-4">
        <Button
          type="submit"
          disabled={loading}
          className="px-8 py-3 bg-primary hover:bg-primary/90 text-white rounded-lg font-medium transition-all duration-200 shadow-lg hover:shadow-xl disabled:opacity-70 disabled:cursor-not-allowed min-w-[200px]"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Searching...
            </>
          ) : (
            <>
              <SearchIcon className="w-4 h-4 mr-2" />
              Search Flights
            </>
          )}
        </Button>
      </div>

      {/* API Status Indicator */}
      <div className="text-center text-xs text-gray-500 pt-2">
        {usingAPISuggestions.origin || usingAPISuggestions.destination ? (
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span>
            Using live airport data from Amadeus API
          </span>
        ) : (
          <span className="inline-flex items-center gap-1">
            <span className="w-2 h-2 bg-yellow-500 rounded-full"></span>
            {/* Using offline airport data */}
            Airport data
          </span>
        )}
      </div>
    </form>
  );
};