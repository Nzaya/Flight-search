import React from 'react';
import { MapPin, DollarSign, Calendar, Plane, ExternalLink, TrendingDown, TrendingUp } from 'lucide-react';
import { Destination } from '../../types';

export interface DestinationGridProps {
  destinations: Destination[];
  origin: string;
  loading?: boolean;
  error?: string;
  onDestinationSelect?: (destination: Destination) => void;
  onViewFlights?: (destinationCode: string) => void;
}

export const DestinationGrid: React.FC<DestinationGridProps> = ({
  destinations,
  origin,
  loading = false,
  error,
  onDestinationSelect,
  onViewFlights,
}) => {
  console.group('🌍 Destination Grid');
  console.log('📊 Destination data:', {
    origin,
    count: destinations.length,
    loading,
    error,
    sample: destinations.slice(0, 2),
  });

  // Format date to readable format
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      return dateStr;
    }
  };

  // Get airport city from IATA code
  const getCityName = (code: string): string => {
    const airportMap: Record<string, string> = {
      'LAX': 'Los Angeles',
      'JFK': 'New York',
      'ORD': 'Chicago',
      'DFW': 'Dallas',
      'MIA': 'Miami',
      'SEA': 'Seattle',
      'ATL': 'Atlanta',
      'DEN': 'Denver',
      'SFO': 'San Francisco',
      'LAS': 'Las Vegas',
      'LHR': 'London',
      'CDG': 'Paris',
      'FRA': 'Frankfurt',
      'DXB': 'Dubai',
      'MAD': 'Madrid',
      'BCN': 'Barcelona',
      'AMS': 'Amsterdam',
      'SYD': 'Sydney',
      'TYO': 'Tokyo',
    };
    return airportMap[code] || code;
  };

  // Calculate days between dates
  const calculateTripDuration = (departureDate: string, returnDate: string): number => {
    try {
      const start = new Date(departureDate);
      const end = new Date(returnDate);
      const diffTime = Math.abs(end.getTime() - start.getTime());
      return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    } catch (error) {
      return 7; // Default 1 week
    }
  };

  // Sort destinations by price (lowest first)
  const sortedDestinations = [...destinations].sort((a, b) => 
    parseFloat(a.price.total) - parseFloat(b.price.total)
  );

  // Get price statistics
  const prices = sortedDestinations.map(d => parseFloat(d.price.total));
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;

  console.log('💰 Price statistics:', {
    min: `$${minPrice.toFixed(2)}`,
    max: `$${maxPrice.toFixed(2)}`,
    avg: `$${avgPrice.toFixed(2)}`,
    count: prices.length,
  });

  if (loading) {
    console.log('⏳ Loading destinations...');
    console.groupEnd();
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary mb-4"></div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Discovering Destinations</h3>
          <p className="text-gray-600">Searching for amazing places you can fly to from {origin}</p>
          <p className="text-sm text-gray-500 mt-2">Using real data from Amadeus API</p>
        </div>
      </div>
    );
  }

  if (error) {
    console.error('❌ Destination grid error:', error);
    console.groupEnd();
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center text-red-600">
          <div className="text-4xl mb-4">⚠️</div>
          <h3 className="text-lg font-semibold mb-2">Unable to load destinations</h3>
          <p className="text-gray-600">{error}</p>
          <p className="text-sm text-gray-500 mt-2">Please try again later</p>
        </div>
      </div>
    );
  }

  if (!destinations || destinations.length === 0) {
    console.log('⚠️ No destinations found');
    console.groupEnd();
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-8">
        <div className="text-center">
          <div className="text-4xl mb-4">🌍</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No destinations found</h3>
          <p className="text-gray-600">Try adjusting your search criteria or budget</p>
          <p className="text-sm text-gray-500 mt-2">From {origin} within your budget</p>
        </div>
      </div>
    );
  }

  console.log(`✅ Displaying ${sortedDestinations.length} destinations`);
  console.groupEnd();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Discover Destinations</h2>
          <p className="text-gray-600">
            From <span className="font-semibold">{origin}</span> • {sortedDestinations.length} destinations found
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
            <span className="font-medium">${minPrice.toFixed(0)}</span> - <span className="font-medium">${maxPrice.toFixed(0)}</span> range
          </div>
          <div className="text-xs text-gray-500 bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
            Real Amadeus Data
          </div>
        </div>
      </div>

      {/* Price Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingDown className="w-4 h-4 text-green-600" />
            <span className="text-sm font-medium text-green-700">Best Deal</span>
          </div>
          <div className="text-2xl font-bold text-green-800">${minPrice.toFixed(2)}</div>
          <div className="text-xs text-green-600">Lowest price available</div>
        </div>
        <div className="bg-blue-50 border border-blue-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-700">Average Price</span>
          </div>
          <div className="text-2xl font-bold text-blue-800">${avgPrice.toFixed(2)}</div>
          <div className="text-xs text-blue-600">Across all destinations</div>
        </div>
        <div className="bg-purple-50 border border-purple-100 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-4 h-4 text-purple-600" />
            <span className="text-sm font-medium text-purple-700">Highest</span>
          </div>
          <div className="text-2xl font-bold text-purple-800">${maxPrice.toFixed(2)}</div>
          <div className="text-xs text-purple-600">Most expensive option</div>
        </div>
      </div>

      {/* Destinations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedDestinations.map((destination, index) => {
          const cityName = getCityName(destination.destination);
          const tripDuration = calculateTripDuration(destination.departureDate, destination.returnDate);
          const price = parseFloat(destination.price.total);
          const isGoodDeal = price < avgPrice;
          const pricePerDay = price / tripDuration;

          return (
            <div
              key={`${destination.destination}-${index}`}
              className="group border border-gray-200 rounded-xl p-5 hover:border-primary hover:shadow-lg transition-all duration-300 cursor-pointer"
              onClick={() => onDestinationSelect?.(destination)}
            >
              {/* Destination Header */}
              <div className="flex justify-between items-start mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                      <Plane className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">{destination.destination}</h3>
                      <p className="text-sm text-gray-600">{cityName}</p>
                    </div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-bold text-gray-900">${price.toFixed(2)}</div>
                  <div className="text-xs text-gray-500">total</div>
                </div>
              </div>

              {/* Trip Details */}
              <div className="space-y-3 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <Calendar className="w-4 h-4" />
                  <span>{formatDate(destination.departureDate)} - {formatDate(destination.returnDate)}</span>
                  <span className="text-xs bg-gray-100 px-2 py-1 rounded">• {tripDuration} days</span>
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <MapPin className="w-4 h-4" />
                  <span>{origin} → {destination.destination}</span>
                </div>
              </div>

              {/* Price Breakdown */}
              <div className="mb-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm text-gray-600">Price per day</span>
                  <span className="text-sm font-semibold text-gray-900">${pricePerDay.toFixed(2)}/day</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`h-2 rounded-full ${isGoodDeal ? 'bg-green-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min((price / maxPrice) * 100, 100)}%` }}
                  ></div>
                </div>
              </div>

              {/* Deal Badge */}
              {isGoodDeal && (
                <div className="inline-flex items-center gap-1 bg-green-100 text-green-800 text-xs font-medium px-3 py-1 rounded-full mb-4">
                  <TrendingDown className="w-3 h-3" />
                  Great Deal • ${(avgPrice - price).toFixed(2)} below average
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex gap-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onDestinationSelect?.(destination);
                  }}
                  className="flex-1 bg-primary text-white px-4 py-2 rounded-lg font-medium hover:bg-primary/90 transition-colors text-sm"
                >
                  Select Destination
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onViewFlights?.(destination.destination);
                  }}
                  className="flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm"
                >
                  <ExternalLink className="w-4 h-4" />
                </button>
              </div>

              {/* Hover Effect Indicator */}
              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Footer Stats */}
      <div className="mt-8 pt-6 border-t border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-600">
            <span className="font-medium">{sortedDestinations.length}</span> destinations shown • 
            Data from Amadeus Flight Inspiration Search • 
            Prices are per passenger for round trip
          </div>
          <div className="text-xs text-gray-500">
            Click any destination to select it and view flights
          </div>
        </div>
      </div>
    </div>
  );
};

// Optional: Loading skeleton component
export const DestinationGridSkeleton: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
      <div className="flex justify-between items-center mb-6">
        <div>
          <div className="h-7 bg-gray-200 rounded w-48 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-64"></div>
        </div>
        <div className="h-8 bg-gray-200 rounded w-24"></div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        {[1, 2, 3].map(i => (
          <div key={i} className="h-24 bg-gray-200 rounded-lg"></div>
        ))}
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3, 4, 5, 6].map(i => (
          <div key={i} className="h-64 bg-gray-200 rounded-xl"></div>
        ))}
      </div>
    </div>
  );
};