import React from 'react';
import { Sliders, DollarSign, Clock, Filter } from 'lucide-react';
import { FilterOptions } from '../../types';

interface FlightFiltersProps {
  filters: FilterOptions;
  onFilterChange: (filters: Partial<FilterOptions>) => void;
  availableAirlines: string[];
}

export const FlightFilters: React.FC<FlightFiltersProps> = ({
  filters,
  onFilterChange,
  availableAirlines
}) => {
  const handleStopsChange = (stops: number) => {
    const currentStops = [...filters.stops];
    if (currentStops.includes(stops)) {
      onFilterChange({ 
        stops: currentStops.filter(s => s !== stops) 
      });
    } else {
      onFilterChange({ 
        stops: [...currentStops, stops] 
      });
    }
  };

  const handleAirlineChange = (airline: string) => {
    const currentAirlines = [...filters.airlines];
    if (currentAirlines.includes(airline)) {
      onFilterChange({
        airlines: currentAirlines.filter(a => a !== airline)
      });
    } else {
      onFilterChange({
        airlines: [...currentAirlines, airline]
      });
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-6">
        <Filter className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-gray-900">Filters</h3>
      </div>

      <div className="space-y-6">
        {/* Price Range */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <DollarSign className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Price Range</h4>
          </div>
          <div className="px-2">
            <input
              type="range"
              min="0"
              max="2000"
              step="50"
              value={filters.maxPrice}
              onChange={(e) => onFilterChange({ maxPrice: parseInt(e.target.value) })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-2">
              <span className="text-sm text-gray-600">$0</span>
              <span className="text-sm font-medium">Up to ${filters.maxPrice}</span>
              <span className="text-sm text-gray-600">$2000</span>
            </div>
          </div>
        </div>

        {/* Stops */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Stops</h4>
          <div className="space-y-2">
            {[0, 1, 2].map(stops => (
              <label key={stops} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.stops.includes(stops)}
                  onChange={() => handleStopsChange(stops)}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span className="text-gray-700">
                  {stops === 0 ? 'Non-stop' : `${stops} stop${stops > 1 ? 's' : ''}`}
                </span>
              </label>
            ))}
          </div>
        </div>

        {/* Airlines */}
        <div>
          <h4 className="font-medium text-gray-900 mb-4">Airlines</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableAirlines.map(airline => (
              <label key={airline} className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={filters.airlines.includes(airline)}
                  onChange={() => handleAirlineChange(airline)}
                  className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                />
                <span className="text-gray-700">{airline}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Departure Time */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Clock className="w-4 h-4 text-gray-600" />
            <h4 className="font-medium text-gray-900">Departure Time</h4>
          </div>
          <div className="px-2">
            <div className="flex justify-between mb-2">
              <span className="text-sm text-gray-600">12 AM</span>
              <span className="text-sm text-gray-600">12 PM</span>
            </div>
            <input
              type="range"
              min="0"
              max="24"
              value={filters.departureTimeRange[0]}
              onChange={(e) => onFilterChange({
                departureTimeRange: [parseInt(e.target.value), filters.departureTimeRange[1]]
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer mb-4"
            />
            <input
              type="range"
              min="0"
              max="24"
              value={filters.departureTimeRange[1]}
              onChange={(e) => onFilterChange({
                departureTimeRange: [filters.departureTimeRange[0], parseInt(e.target.value)]
              })}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
            <div className="text-center mt-2">
              <span className="text-sm font-medium">
                {filters.departureTimeRange[0]}:00 - {filters.departureTimeRange[1]}:00
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};