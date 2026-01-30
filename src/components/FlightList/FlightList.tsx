import React from 'react';
import { FlightCard } from './FlightCard';
import { Flight } from '../../types';

interface FlightListProps {
  flights: Flight[];
  loading?: boolean;
}

export const FlightList: React.FC<FlightListProps> = ({ flights, loading }) => {
  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
            <div className="flex items-center justify-between">
              <div className="space-y-3">
                <div className="h-4 bg-gray-200 rounded w-32"></div>
                <div className="h-4 bg-gray-200 rounded w-24"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (flights.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-gray-400 mb-4">No flights found</div>
        <p className="text-gray-600">Try adjusting your search or filters</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-600 mb-2">
        Showing {flights.length} flight{flights.length !== 1 ? 's' : ''}
      </div>
      {flights.map(flight => (
        <FlightCard key={flight.id} flight={flight} />
      ))}
    </div>
  );
};