import React, { useEffect, useState } from 'react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer 
} from 'recharts';

// Update interface to match our new API response
interface PriceDataPoint {
  date: string;
  price: number;
  airline?: string; // Optional from API
}

interface PriceTrendGraphProps {
  data: PriceDataPoint[];
  currentPrice?: number;
  isLoading?: boolean;
}

export const PriceTrendGraph: React.FC<PriceTrendGraphProps> = ({ 
  data, 
  currentPrice,
  isLoading = false 
}) => {
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

  console.group('📊 Price Trend Graph');
  console.log('📈 Data received:', {
    dataPoints: data?.length || 0,
    hasData: data && data.length > 0,
    isLoading,
    isClient,
  });

  if (isLoading) {
    console.log('⏳ Loading price trend data...');
    console.groupEnd();
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Price Trends</h3>
        <div className="h-64 min-h-[200px] w-full flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading price trends...</p>
            <p className="text-sm text-gray-500">Fetching real data from Amadeus API</p>
          </div>
        </div>
      </div>
    );
  }

  if (!data || data.length === 0) {
    console.log('⚠️ No price trend data available');
    console.groupEnd();
    return (
      <div className="bg-white rounded-xl border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-6">Price Trends</h3>
        <div className="text-center text-gray-500 py-8">
          <div className="text-4xl mb-4">📊</div>
          <p className="font-medium">No price trend data available</p>
          <p className="text-sm mt-2">Try searching for a flight route first</p>
        </div>
      </div>
    );
  }

  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) {
        console.warn('⚠️ Invalid date string:', dateStr);
        return dateStr;
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric',
        weekday: 'short' 
      });
    } catch (error) {
      console.error('❌ Error formatting date:', error);
      return dateStr;
    }
  };

  // Format data for chart - ensure we have valid numbers
  const chartData = data
    .filter(item => item && item.date && typeof item.price === 'number')
    .map(item => ({
      ...item,
      // Ensure price is a number
      price: typeof item.price === 'number' ? item.price : parseFloat(item.price as any) || 0,
      formattedDate: formatDate(item.date),
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  console.log('📊 Chart data prepared:', {
    originalPoints: data.length,
    validPoints: chartData.length,
    dateRange: chartData.length > 0 ? {
      start: formatDate(chartData[0].date),
      end: formatDate(chartData[chartData.length - 1].date),
    } : 'No data',
    priceRange: chartData.length > 0 ? {
      min: `$${Math.min(...chartData.map(d => d.price))}`,
      max: `$${Math.max(...chartData.map(d => d.price))}`,
      avg: `$${Math.round(chartData.reduce((sum, d) => sum + d.price, 0) / chartData.length)}`,
    } : 'No data',
  });

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const dataPoint = payload[0].payload;
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-sm">
          <p className="text-gray-600 font-medium">{formatDate(label)}</p>
          <p className="text-primary font-bold text-lg">${payload[0].value.toLocaleString()}</p>
          {dataPoint.airline && dataPoint.airline !== 'Various' && (
            <p className="text-sm text-gray-500 mt-1">Airline: {dataPoint.airline}</p>
          )}
          <p className="text-xs text-gray-400 mt-2">Price per passenger</p>
        </div>
      );
    }
    return null;
  };

  console.groupEnd();

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6">
      <div className="flex justify-between items-center mb-6">
        <h3 className="text-lg font-semibold text-gray-900">Price Trends</h3>
        <div className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
          Real data from Amadeus API
        </div>
      </div>
      
      <div className="h-64 min-h-[200px] w-full">
        {isClient && (
          <ResponsiveContainer 
            width="100%" 
            height="100%" 
            minHeight={200} 
            minWidth={0}
          >
            <LineChart 
              data={chartData} 
              margin={{ top: 10, right: 30, left: 0, bottom: 5 }}
            >
              <CartesianGrid 
                strokeDasharray="3 3" 
                stroke="#f0f0f0" 
                vertical={false}
              />
              <XAxis 
                dataKey="date" 
                tickFormatter={formatDate}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                minTickGap={20}
              />
              <YAxis 
                tickFormatter={(value: number) => `$${value}`}
                tick={{ fill: '#6b7280', fontSize: 12 }}
                axisLine={{ stroke: '#e5e7eb' }}
                tickLine={{ stroke: '#e5e7eb' }}
                domain={['dataMin - 20', 'dataMax + 20']}
                width={60}
              />
              <Tooltip 
                content={<CustomTooltip />}
                cursor={{ stroke: '#e5e7eb', strokeWidth: 1 }}
              />
              <Line
                type="monotone"
                dataKey="price"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ 
                  r: 4, 
                  fill: '#3b82f6',
                  stroke: '#ffffff',
                  strokeWidth: 2 
                }}
                activeDot={{ 
                  r: 6, 
                  fill: '#3b82f6',
                  stroke: '#ffffff',
                  strokeWidth: 2 
                }}
              />
            </LineChart>
          </ResponsiveContainer>
        )}
      </div>
      
      <div className="mt-6 pt-4 border-t border-gray-100">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <p className="text-sm text-gray-600">Current average flight price</p>
            <p className="text-2xl font-bold text-primary">
              ${currentPrice?.toLocaleString() || 'N/A'}
            </p>
          </div>
          
          {chartData.length > 0 && (
            <div className="flex flex-wrap gap-4">
              <div className="text-center">
                <p className="text-xs text-gray-500">Lowest</p>
                <p className="text-sm font-semibold text-green-600">
                  ${Math.min(...chartData.map(d => d.price)).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Highest</p>
                <p className="text-sm font-semibold text-red-600">
                  ${Math.max(...chartData.map(d => d.price)).toLocaleString()}
                </p>
              </div>
              <div className="text-center">
                <p className="text-xs text-gray-500">Avg. Trend</p>
                <p className="text-sm font-semibold text-blue-600">
                  ${Math.round(chartData.reduce((sum, d) => sum + d.price, 0) / chartData.length).toLocaleString()}
                </p>
              </div>
            </div>
          )}
        </div>
        
        {chartData.length > 0 && (
          <div className="mt-4 text-xs text-gray-500">
            <p>
              Showing price trends for {chartData.length} date{chartData.length !== 1 ? 's' : ''} • 
              Data cached to conserve API quota
            </p>
          </div>
        )}
      </div>
    </div>
  );
};