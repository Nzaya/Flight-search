import React, { useEffect, useState } from 'react';
import { SearchForm } from './components/FlightSearch/SearchForm';
import { FlightList } from './components/FlightList/FlightList';
import { FlightFilters } from './components/Filters/FlightFilters';
import { PriceTrendGraph } from './components/PriceGraph/PriceTrendGraph';
import { DestinationGrid } from './components/DestinationGrid/DestinationGrid';
import { useFlights } from './hooks/useFlights';
import { SearchParams, Flight, PriceDataPoint, Destination } from './types';
import { FlightAPI } from './lib/api';

function App() {
  const { 
    filteredFlights, 
    loading, 
    error, 
    search, 
    filters, 
    updateFilters,
    searchParams 
  } = useFlights();
  
  const [priceTrendData, setPriceTrendData] = useState<PriceDataPoint[]>([]);
  const [priceTrendsLoading, setPriceTrendsLoading] = useState(false);
  const [availableAirlines, setAvailableAirlines] = useState<string[]>([]);
  
  // States for DestinationGrid
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [destinationsLoading, setDestinationsLoading] = useState(false);
  const [showDestinations, setShowDestinations] = useState(true);
  const [selectedOrigin, setSelectedOrigin] = useState('JFK');

  // Extract unique airlines from flights
  useEffect(() => {
    if (filteredFlights.length > 0) {
      const airlines = Array.from(new Set(filteredFlights.map((f: Flight) => f.airline)));
      setAvailableAirlines(airlines);
    }
  }, [filteredFlights]);

  // Fetch price trends when search params change
  useEffect(() => {
    if (searchParams) {
      fetchPriceTrends(searchParams);
    }
  }, [searchParams]);

  // Fetch destinations when origin changes or on initial load
  useEffect(() => {
    if (showDestinations) {
      fetchDestinations(selectedOrigin);
    }
  }, [selectedOrigin, showDestinations]);

  const fetchPriceTrends = async (params: SearchParams) => {
    console.log('📈 Fetching price trends...');
    setPriceTrendsLoading(true);
    try {
      const trends = await FlightAPI.getPriceTrends(params);
      console.log('✅ Received price trends:', trends.length);
      setPriceTrendData(trends);
    } catch (err) {
      console.error('Failed to fetch price trends:', err);
      setPriceTrendData([]);
    } finally {
      setPriceTrendsLoading(false);
    }
  };

  const fetchDestinations = async (origin: string) => {
    console.log('🌍 Fetching destinations from:', origin);
    setDestinationsLoading(true);
    try {
      const response = await FlightAPI.getFlightInspiration(origin, 1000, false);
      if (response.data) {
        // Filter out destinations that are the same as origin
        const filteredDestinations = response.data.filter((dest: Destination) => 
          dest.destination !== origin
        );
        setDestinations(filteredDestinations);
        console.log('✅ Received destinations:', filteredDestinations.length);
        
        if (filteredDestinations.length !== response.data.length) {
          console.log(`🗑️ Filtered out ${response.data.length - filteredDestinations.length} destinations that match origin`);
        }
      }
    } catch (err) {
      console.error('Failed to fetch destinations:', err);
      setDestinations([]);
    } finally {
      setDestinationsLoading(false);
    }
  };

  const handleSearch = (params: SearchParams) => {
    console.log('🌍 Starting new search...');
    setShowDestinations(false);
    search(params);
  };

  const handleDestinationSelect = (destination: Destination) => {
    console.log('📍 Destination selected:', destination.destination);
    
    // PREVENT SAME ORIGIN/DESTINATION
    if (selectedOrigin === destination.destination) {
      console.warn('⚠️ Cannot select same airport as destination');
      alert('Please select a different destination than your origin');
      return;
    }
    
    const searchParams: SearchParams = {
      origin: selectedOrigin,
      destination: destination.destination,
      departureDate: new Date(destination.departureDate),
      returnDate: new Date(destination.returnDate),
      passengers: {
        adults: 1,
        children: 0,
        infants: 0
      }
    };
    
    handleSearch(searchParams);
  };

  const handleViewFlights = (destinationCode: string) => {
    console.log('✈️ View flights for:', destinationCode);
    
    // PREVENT SAME ORIGIN/DESTINATION
    if (selectedOrigin === destinationCode) {
      console.warn('⚠️ Cannot view flights to same airport');
      alert('Please select a different destination than your origin');
      return;
    }
    
    const searchParams: SearchParams = {
      origin: selectedOrigin,
      destination: destinationCode,
      departureDate: new Date(),
      passengers: {
        adults: 1,
        children: 0,
        infants: 0
      }
    };
    
    handleSearch(searchParams);
  };

  const handleShowDestinations = () => {
    setShowDestinations(true);
  };

  const handleOriginChange = (origin: string) => {
    setSelectedOrigin(origin);
    setShowDestinations(true);
  };

  const calculateAveragePrice = () => {
    if (filteredFlights.length === 0) return 0;
    const total = filteredFlights.reduce((sum: number, flight: Flight) => sum + flight.price, 0);
    return Math.round(total / filteredFlights.length);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="container mx-auto px-4 py-6">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">✈️ SkySearch</h1>
              <p className="text-gray-600 mt-2">Find the best flight deals in seconds</p>
            </div>
            {!showDestinations && filteredFlights.length > 0 && (
              <button
                onClick={handleShowDestinations}
                className="px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
              >
                ← Back to Destinations
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Search Form */}
        <div className="mb-8">
          <SearchForm 
            onSubmit={handleSearch} 
            loading={loading}
            onOriginChange={handleOriginChange}
          />
        </div>

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-xl p-4">
            <p className="text-red-600">{error}</p>
          </div>
        )}

        {/* Destination Discovery View */}
        {showDestinations && (
          <div className="mb-8">
            <DestinationGrid
              destinations={destinations}
              origin={selectedOrigin}
              loading={destinationsLoading}
              onDestinationSelect={handleDestinationSelect}
              onViewFlights={handleViewFlights}
            />
          </div>
        )}

        {/* Flight Results View */}
        {!showDestinations && (filteredFlights.length > 0 || loading) && (
          <>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Filters Sidebar */}
              <div className="lg:col-span-1">
                <div className="sticky top-8">
                  <FlightFilters
                    filters={filters}
                    onFilterChange={updateFilters}
                    availableAirlines={availableAirlines}
                  />
                </div>
              </div>

              {/* Main Content */}
              <div className="lg:col-span-2">
                {/* Price Graph */}
                <div className="mb-8">
                  <PriceTrendGraph 
                    data={priceTrendData} 
                    currentPrice={calculateAveragePrice()}
                    isLoading={priceTrendsLoading}
                  />
                </div>

                {/* Flight List */}
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Flights from {searchParams?.origin} to {searchParams?.destination}
                  </h2>
                  <FlightList flights={filteredFlights} loading={loading} />
                </div>
              </div>
            </div>
          </>
        )}

        {/* Empty State */}
        {!loading && !destinationsLoading && !showDestinations && filteredFlights.length === 0 && !error && (
          <div className="text-center py-16">
            <div className="text-gray-400 text-6xl mb-4">✈️</div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">No flights found</h3>
            <p className="text-gray-600 mb-4">Try adjusting your search criteria</p>
            <button
              onClick={handleShowDestinations}
              className="px-6 py-3 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors"
            >
              Browse Destinations Instead
            </button>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t bg-white mt-12">
        <div className="container mx-auto px-4 py-8">
          <div className="text-center text-gray-600">
            <p>© {new Date().getFullYear()} SkySearch Flight Engine</p>
            <p className="text-sm mt-2 text-gray-500">
              {process.env.REACT_APP_USE_MOCK_DATA === 'true' 
                ? 'Using enhanced mock data with real price trends' 
                : 'Using real Amadeus API data with smart caching'}
            </p>
            {/* <p className="text-xs mt-1 text-gray-400">
              API calls cached to conserve monthly quota (39 calls/month)
            </p> */}
          </div>
        </div>
      </footer>
    </div>
  );
}

export default App;