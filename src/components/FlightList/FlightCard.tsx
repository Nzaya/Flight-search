import React from 'react';
import { Clock, MapPin, Plane } from 'lucide-react';
import { Flight } from '../../types';

interface FlightCardProps {
  flight: Flight;
}

export const FlightCard: React.FC<FlightCardProps> = ({ flight }) => {
  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-lg transition-shadow duration-200">
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
        {/* Airline Info */}
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
            <span className="text-primary font-bold text-lg">{flight.airlineLogo}</span>
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">{flight.airline}</h3>
            <p className="text-sm text-gray-500">{flight.flightNumber}</p>
          </div>
        </div>

        {/* Flight Times */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-4">
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{flight.departureTime}</div>
              <div className="text-sm text-gray-600">{flight.origin}</div>
            </div>
            
            <div className="flex-1 px-4">
              <div className="relative">
                <div className="h-px bg-gray-300"></div>
                <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
                  <Plane className="w-5 h-5 text-primary" />
                </div>
              </div>
              <div className="text-center mt-2">
                <div className="text-sm text-gray-600 flex items-center justify-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatDuration(flight.duration)}
                </div>
                <div className="text-xs text-gray-500">
                  {flight.stops === 0 ? 'Non-stop' : `${flight.stops} stop${flight.stops > 1 ? 's' : ''}`}
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <div className="text-2xl font-bold text-gray-900">{flight.arrivalTime}</div>
              <div className="text-sm text-gray-600">{flight.destination}</div>
            </div>
          </div>
          
          {flight.stopDetails && flight.stopDetails.length > 0 && (
            <div className="text-sm text-gray-500 flex items-center gap-2">
              <MapPin className="w-4 h-4" />
              Via {flight.stopDetails.map(stop => stop.airport).join(', ')}
            </div>
          )}
        </div>

        {/* Price & Action */}
        <div className="text-center lg:text-right">
          <div className="text-3xl font-bold text-primary mb-2">
            ${flight.price}
          </div>
          <p className="text-sm text-gray-500 mb-4">per passenger</p>
          <button className="px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary/90 transition-colors font-medium">
            Select Flight
          </button>
        </div>
      </div>
    </div>
  );
};