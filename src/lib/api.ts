import axios from 'axios';
import { Flight, SearchParams, PriceDataPoint } from '../types';

// ==================== CONFIGURATION ====================
const AMADEUS_CONFIG = {
  API_KEY: process.env.REACT_APP_AMADEUS_API_KEY || 'YOUR_API_KEY_HERE',
  API_SECRET: process.env.REACT_APP_AMADEUS_API_SECRET || 'YOUR_API_SECRET_HERE',
  BASE_URL: 'https://test.api.amadeus.com/v1',
  MOCK_MODE: process.env.REACT_APP_USE_MOCK_DATA === 'true' || false,
} as const;

// ==================== CACHING SYSTEM ====================
interface APICache<T> {
  data: T;
  timestamp: number;
  expiry: number; // milliseconds
}

class APICacheManager {
  private static readonly CACHE_PREFIX = 'flight_cache_';
  
  /**
   * Store data in cache
   */
  static set<T>(key: string, data: T, expiryHours: number = 24): void {
    console.log(`💾 Caching data for key: ${key} (expires in ${expiryHours}h)`);
    
    const cache: APICache<T> = {
      data,
      timestamp: Date.now(),
      expiry: expiryHours * 60 * 60 * 1000, // Convert hours to milliseconds
    };
    
    try {
      localStorage.setItem(`${this.CACHE_PREFIX}${key}`, JSON.stringify(cache));
    } catch (error) {
      console.warn('⚠️ Failed to save cache to localStorage:', error);
    }
  }
  
  /**
   * Retrieve data from cache if not expired
   */
  static get<T>(key: string): T | null {
    try {
      const cached = localStorage.getItem(`${this.CACHE_PREFIX}${key}`);
      if (!cached) {
        console.log(`💾 Cache miss for key: ${key}`);
        return null;
      }
      
      const cache: APICache<T> = JSON.parse(cached);
      const isExpired = Date.now() - cache.timestamp > cache.expiry;
      
      if (isExpired) {
        console.log(`💾 Cache expired for key: ${key}`);
        localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
        return null;
      }
      
      console.log(`💾 Cache hit for key: ${key}`);
      return cache.data;
    } catch (error) {
      console.warn('⚠️ Error reading cache:', error);
      return null;
    }
  }
  
  /**
   * Clear specific cache
   */
  static clear(key: string): void {
    localStorage.removeItem(`${this.CACHE_PREFIX}${key}`);
  }
  
  /**
   * Clear all flight caches
   */
  static clearAll(): void {
    Object.keys(localStorage).forEach(key => {
      if (key.startsWith(this.CACHE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
  }
}

// ==================== API RATE LIMITER ====================
class APIRateLimiter {
  private static readonly MAX_CALLS_PER_MINUTE = 10;
  private static readonly MAX_CALLS_PER_DAY = 39;
  private static callsToday: number = 0;
  private static callsThisMinute: number = 0;
  private static minuteStart: number = Date.now();
  private static readonly STORAGE_KEY = 'amadeus_api_calls';

  static initialize() {
    // Load from localStorage
    const saved = localStorage.getItem(this.STORAGE_KEY);
    if (saved) {
      try {
        const data = JSON.parse(saved);
        this.callsToday = data.callsToday || 0;
        this.callsThisMinute = data.callsThisMinute || 0;
        this.minuteStart = data.minuteStart || Date.now();
        
        // Reset if it's a new day (simplified - checks if saved date is today)
        const savedDate = data.date;
        const today = new Date().toDateString();
        if (savedDate !== today) {
          this.callsToday = 0;
          console.log('🔄 New day - resetting API call counter');
        }
      } catch (e) {
        console.warn('⚠️ Failed to load API call data:', e);
      }
    }
  }

  static canMakeCall(): { allowed: boolean; reason?: string; callsLeft: number } {
    const now = Date.now();
    
    // Reset minute counter if minute has passed
    if (now - this.minuteStart > 60000) {
      this.callsThisMinute = 0;
      this.minuteStart = now;
    }
    
    // Check minute limit
    if (this.callsThisMinute >= this.MAX_CALLS_PER_MINUTE) {
      const waitTime = Math.ceil((60000 - (now - this.minuteStart)) / 1000);
      return { 
        allowed: false, 
        reason: `Rate limit: ${this.MAX_CALLS_PER_MINUTE} calls/minute. Wait ${waitTime}s`,
        callsLeft: 0
      };
    }
    
    // Check daily limit
    const callsLeft = this.MAX_CALLS_PER_DAY - this.callsToday;
    if (this.callsToday >= this.MAX_CALLS_PER_DAY) {
      return { 
        allowed: false, 
        reason: `Daily quota exceeded: ${this.MAX_CALLS_PER_DAY} calls/day`,
        callsLeft: 0
      };
    }
    
    return { allowed: true, callsLeft };
  }

  static recordCall() {
    this.callsToday++;
    this.callsThisMinute++;
    
    // Save to localStorage
    const data = {
      callsToday: this.callsToday,
      callsThisMinute: this.callsThisMinute,
      minuteStart: this.minuteStart,
      date: new Date().toDateString()
    };
    
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.warn('⚠️ Failed to save API call data:', e);
    }
    
    console.log(`📊 API calls today: ${this.callsToday}/${this.MAX_CALLS_PER_DAY} (${this.MAX_CALLS_PER_DAY - this.callsToday} left)`);
  }

  static resetDailyCount() {
    this.callsToday = 0;
    this.callsThisMinute = 0;
    this.minuteStart = Date.now();
    
    try {
      localStorage.removeItem(this.STORAGE_KEY);
    } catch (e) {
      console.warn('⚠️ Failed to clear API call data:', e);
    }
    
    console.log('🔄 Reset API call counter');
  }

  static getStats() {
    return {
      callsToday: this.callsToday,
      callsThisMinute: this.callsThisMinute,
      maxPerDay: this.MAX_CALLS_PER_DAY,
      maxPerMinute: this.MAX_CALLS_PER_MINUTE,
      callsLeftToday: this.MAX_CALLS_PER_DAY - this.callsToday
    };
  }
}

// Initialize rate limiter
APIRateLimiter.initialize();

// ==================== MOCK DATA ====================
const MOCK_AIRLINES = [
  { code: 'AA', name: 'American Airlines', logo: 'AA' },
  { code: 'DL', name: 'Delta Air Lines', logo: 'DL' },
  { code: 'UA', name: 'United Airlines', logo: 'UA' },
  { code: 'WN', name: 'Southwest Airlines', logo: 'WN' },
  { code: 'B6', name: 'JetBlue', logo: 'B6' },
  { code: 'AS', name: 'Alaska Airlines', logo: 'AS' },
  { code: 'BA', name: 'British Airways', logo: 'BA' },
  { code: 'LH', name: 'Lufthansa', logo: 'LH' },
  { code: 'AF', name: 'Air France', logo: 'AF' },
  { code: 'EK', name: 'Emirates', logo: 'EK' },
] as const;

const MOCK_AIRPORTS = [
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
  { code: 'LHR', name: 'Heathrow Airport', city: 'London' },
  { code: 'CDG', name: 'Charles de Gaulle Airport', city: 'Paris' },
  { code: 'FRA', name: 'Frankfurt Airport', city: 'Frankfurt' },
  { code: 'DXB', name: 'Dubai International', city: 'Dubai' },
] as const;

// ==================== TOKEN MANAGEMENT ====================
interface TokenInfo {
  accessToken: string;
  expiresAt: number;
}

let tokenInfo: TokenInfo | null = null;

/**
 * Get Amadeus API access token with caching
 */
const getAmadeusToken = async (): Promise<string> => {
  console.group('🔐 Token Management');
  
  // Check if we have a valid cached token
  if (tokenInfo && Date.now() < tokenInfo.expiresAt) {
    console.log('✅ Using cached Amadeus token');
    console.groupEnd();
    return tokenInfo.accessToken;
  }

  console.log('🔄 Fetching new Amadeus token from API...');
  
  try {
    const response = await axios.post(
      'https://test.api.amadeus.com/v1/security/oauth2/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: AMADEUS_CONFIG.API_KEY,
        client_secret: AMADEUS_CONFIG.API_SECRET,
      }),
      {
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        timeout: 10000,
      }
    );

    console.log('📥 Received token response from Amadeus');

    if (response.data?.access_token) {
      const accessToken = response.data.access_token;
      // Set expiry to 25 minutes (5 minute buffer before actual 30 min expiry)
      const expiresAt = Date.now() + (25 * 60 * 1000);
      
      tokenInfo = {
        accessToken,
        expiresAt,
      };
      
      console.log('✅ Successfully obtained Amadeus token');
      console.groupEnd();
      return accessToken;
    } else {
      console.warn('⚠️ Amadeus token response missing access_token');
      throw new Error('No access token in response');
    }
  } catch (error) {
    console.error('❌ Failed to get Amadeus token:', error);
    
    if (axios.isAxiosError(error)) {
      console.error('📡 Axios Error Details:', {
        status: error.response?.status,
        statusText: error.response?.statusText,
      });
      
      if (error.response?.status === 401) {
        console.error('🔑 Authentication failed. Check API credentials in .env');
      }
    }
    
    console.log('🔄 Will use mock data for this session');
    console.groupEnd();
    throw new Error('Failed to authenticate with Amadeus API');
  }
};

// ==================== MAIN FLIGHT API CLASS ====================
export class FlightAPI {
  // ==================== CORE FLIGHT SEARCH ====================
  /**
   * Search for flights - Uses hybrid approach with caching
   */
  static async searchFlights(params: SearchParams): Promise<Flight[]> {
    console.group('🛫 Flight Search Started');
    console.log('📋 Search Parameters:', {
      origin: params.origin,
      destination: params.destination,
      departureDate: params.departureDate.toISOString().split('T')[0],
      passengers: params.passengers,
    });

    // VALIDATION: Check if origin and destination are the same
    if (params.origin === params.destination) {
      console.warn('⚠️ Invalid search: Origin and destination are the same');
      console.log('🔄 Using mock flights instead');
      console.groupEnd();
      return this.generateEnhancedMockFlights(params);
    }

    // Check if mock mode is enabled
    if (AMADEUS_CONFIG.MOCK_MODE) {
      console.log('🎭 MOCK MODE: Using enhanced mock flights (configured)');
      console.groupEnd();
      return this.generateEnhancedMockFlights(params);
    }

    // Try to get real price data first (for enhanced mock generation)
    try {
      console.log('💰 Attempting to get real price data for enhanced mock generation...');
      
      // Get price trends for this route (cached)
      const priceTrends = await this.getPriceTrends(params);
      const avgPrice = priceTrends.length > 0 
        ? priceTrends.reduce((sum, p) => sum + p.price, 0) / priceTrends.length
        : 300; // Fallback average
      
      console.log('📊 Using real price data for enhanced mock generation:', {
        avgPrice: `$${Math.round(avgPrice)}`,
        dataPoints: priceTrends.length,
      });
      
      // Generate enhanced mock flights based on real price data
      const enhancedFlights = await this.generateEnhancedMockFlights(params, avgPrice);
      console.log(`✅ Generated ${enhancedFlights.length} enhanced mock flights`);
      console.groupEnd();
      return enhancedFlights;
      
    } catch (error) {
      console.warn('⚠️ Could not get real price data:', error);
      console.log('🔄 Falling back to basic mock flights');
      const mockFlights = await this.generateEnhancedMockFlights(params);
      console.groupEnd();
      return mockFlights;
    }
  }

  // ==================== FREE AMADEUS APIS ====================
  /**
   * FLIGHT INSPIRATION SEARCH (FREE API)
   * Get destinations from origin within budget
   */
  static async getFlightInspiration(
    origin: string, 
    maxPrice: number = 1000,
    oneWay: boolean = false
  ): Promise<any> {
    console.group('🌍 Flight Inspiration Search');
    console.log('🔍 Searching destinations from:', origin);
    console.log('💰 Max price:', maxPrice, 'One-way:', oneWay);

    // Check cache first (24 hour cache for destinations)
    const cacheKey = `inspiration_${origin}_${maxPrice}_${oneWay}`;
    const cached = APICacheManager.get<any>(cacheKey);
    if (cached) {
      console.log('💾 Using cached inspiration data');
      console.groupEnd();
      return cached;
    }

    // Check if mock mode
    if (AMADEUS_CONFIG.MOCK_MODE) {
      console.log('🎭 MOCK MODE: Using mock inspiration data');
      const mockData = this.getMockInspirationData(origin, maxPrice, oneWay);
      console.groupEnd();
      return mockData;
    }

    // Check rate limits
    const rateLimitCheck = APIRateLimiter.canMakeCall();
    if (!rateLimitCheck.allowed) {
      console.warn(`⏳ ${rateLimitCheck.reason}`);
      console.log('🔄 Using mock inspiration data due to rate limits');
      const mockData = this.getMockInspirationData(origin, maxPrice, oneWay);
      console.groupEnd();
      return mockData;
    }

    try {
      console.log('🌐 Calling Amadeus Flight Inspiration Search API...');
      APIRateLimiter.recordCall();
      const token = await getAmadeusToken();
      
      const url = `${AMADEUS_CONFIG.BASE_URL}/shopping/flight-destinations`;
      const searchParams = new URLSearchParams({
        origin: origin,
        maxPrice: maxPrice.toString(),
        oneWay: oneWay.toString(),
        duration: '1,15', // Trip duration 1-15 days
        nonStop: 'false',
        viewBy: 'DESTINATION',
      });

      console.log('📤 API Request URL:', `${url}?${searchParams.toString()}`);

      const response = await axios.get(`${url}?${searchParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log('✅ Successfully received inspiration data');
      console.log('📊 Response stats:', {
        count: response.data?.meta?.count || 0,
        destinations: response.data?.data?.length || 0,
      });

      // Cache for 24 hours (destinations don't change often)
      APICacheManager.set(cacheKey, response.data, 24);
      
      console.groupEnd();
      return response.data;
      
    } catch (error) {
      console.error('❌ Flight Inspiration Search failed:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('📡 API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
        
        // If API fails, use mock data
        console.log('🔄 Falling back to mock inspiration data');
        const mockData = this.getMockInspirationData(origin, maxPrice, oneWay);
        console.groupEnd();
        return mockData;
      }
      
      console.groupEnd();
      throw error;
    }
  }

  /**
   * FLIGHT CHEAPEST DATE SEARCH (FREE API)
   * Get price trends for a specific route
   */
  static async getFlightCheapestDates(
    origin: string, 
    destination: string,
    oneWay: boolean = false
  ): Promise<PriceDataPoint[]> {
    console.group('📅 Flight Cheapest Date Search');
    console.log('🔍 Searching price trends for:', `${origin} → ${destination}`);
    console.log('💰 One-way:', oneWay);

    // VALIDATION: Check if origin and destination are the same
    if (origin === destination) {
      console.warn('⚠️ Skipping API call: Origin and destination are the same');
      console.log('🔄 Using mock price trends instead');
      console.groupEnd();
      return this.getMockPriceTrendsForRoute(origin, destination);
    }

    // Check cache first (7 day cache for price trends)
    const cacheKey = `cheapest_dates_${origin}_${destination}_${oneWay}`;
    const cached = APICacheManager.get<PriceDataPoint[]>(cacheKey);
    if (cached) {
      console.log('💾 Using cached price trends');
      console.groupEnd();
      return cached;
    }

    // Check if mock mode
    if (AMADEUS_CONFIG.MOCK_MODE) {
      console.log('🎭 MOCK MODE: Using mock price trends');
      const mockTrends = this.getMockPriceTrendsForRoute(origin, destination);
      console.groupEnd();
      return mockTrends;
    }

    // Check rate limits
    const rateLimitCheck = APIRateLimiter.canMakeCall();
    if (!rateLimitCheck.allowed) {
      console.warn(`⏳ ${rateLimitCheck.reason}`);
      console.log('🔄 Using mock price trends due to rate limits');
      const mockTrends = this.getMockPriceTrendsForRoute(origin, destination);
      console.groupEnd();
      return mockTrends;
    }

    try {
      console.log('🌐 Calling Amadeus Flight Cheapest Date Search API...');
      APIRateLimiter.recordCall();
      const token = await getAmadeusToken();
      
      const url = `${AMADEUS_CONFIG.BASE_URL}/shopping/flight-dates`;
      const searchParams = new URLSearchParams({
        origin: origin,
        destination: destination,
        oneWay: oneWay.toString(),
        duration: '1,15',
        nonStop: 'false',
        viewBy: 'DATE', // Get prices by date
      });

      console.log('📤 API Request URL:', `${url}?${searchParams.toString()}`);

      const response = await axios.get(`${url}?${searchParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 10000,
      });

      console.log('✅ Successfully received price trend data');
      
      // Transform to our PriceDataPoint format
      const priceTrends: PriceDataPoint[] = [];
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        response.data.data.forEach((item: any) => {
          if (item.price?.total) {
            priceTrends.push({
              date: item.departureDate,
              price: parseFloat(item.price.total),
              airline: 'Various', // This API doesn't provide airline per date
            });
          }
        });
        
        console.log(`📊 Extracted ${priceTrends.length} price points`);
        
        // Sort by date
        priceTrends.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
        
        // Cache for 7 days (price trends relatively stable)
        APICacheManager.set(cacheKey, priceTrends, 168); // 168 hours = 7 days
        
        console.groupEnd();
        return priceTrends;
      }
      
      console.warn('⚠️ No price data in response');
      console.log('🔄 Falling back to mock price trends');
      const mockTrends = this.getMockPriceTrendsForRoute(origin, destination);
      console.groupEnd();
      return mockTrends;
      
    } catch (error) {
      console.error('❌ Flight Cheapest Date Search failed:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('📡 API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
        
        // Handle rate limiting
        if (error.response?.status === 429) {
          console.warn('⏳ Rate limited by Amadeus API. Please wait before making more requests.');
          console.log('📊 Monthly quota: 39 calls for free tier');
        }
        
        // Use mock data for all API errors
        console.log('🔄 Falling back to mock price trends');
        const mockTrends = this.getMockPriceTrendsForRoute(origin, destination);
        console.groupEnd();
        return mockTrends;
      }
      
      console.groupEnd();
      throw error;
    }
  }

  // ==================== PRICE TRENDS (UPDATED) ====================
  /**
   * Get price trends - Uses FREE Flight Cheapest Date Search API
   */
  static async getPriceTrends(params: SearchParams): Promise<PriceDataPoint[]> {
    console.group('📈 Price Trends Request');
    console.log('📋 Parameters:', {
      origin: params.origin,
      destination: params.destination,
    });

    // Validate parameters before making API call
    if (params.origin === params.destination) {
      console.warn('⚠️ Skipping price trends: Origin and destination are the same');
      console.log('🔄 Using mock price trends instead');
      console.groupEnd();
      return this.getMockPriceTrendsForRoute(params.origin, params.destination);
    }

    // Use the FREE Flight Cheapest Date Search API
    return this.getFlightCheapestDates(params.origin, params.destination);
  }

  // ==================== AIRPORT SUGGESTIONS (UPDATED WITH CACHE) ====================
  /**
   * Get airport suggestions with caching
   */
  static async getAirportSuggestions(query: string): Promise<Array<{code: string, name: string, city: string}>> {
    console.group('🔤 Airport Suggestions');
    console.log('🔍 Query:', query);
    
    if (!query || query.length < 2) {
      console.log('⚠️ Query too short, returning empty');
      console.groupEnd();
      return [];
    }

    // Check cache first (7 day cache for airport searches)
    const cacheKey = `airports_${query.toLowerCase()}`;
    const cached = APICacheManager.get<Array<{code: string, name: string, city: string}>>(cacheKey);
    if (cached) {
      console.log('💾 Using cached airport suggestions');
      console.groupEnd();
      return cached;
    }

    // Check if mock mode
    if (AMADEUS_CONFIG.MOCK_MODE) {
      console.log('🎭 MOCK MODE: Using mock airport suggestions');
      const mockSuggestions = this.getMockAirportSuggestions(query);
      console.groupEnd();
      return mockSuggestions;
    }

    // Check rate limits
    const rateLimitCheck = APIRateLimiter.canMakeCall();
    if (!rateLimitCheck.allowed) {
      console.warn(`⏳ ${rateLimitCheck.reason}`);
      console.log('🔄 Using mock airport suggestions due to rate limits');
      const mockSuggestions = this.getMockAirportSuggestions(query);
      console.groupEnd();
      return mockSuggestions;
    }

    try {
      console.log('🌐 Calling Amadeus Airport Search API...');
      APIRateLimiter.recordCall();
      const token = await getAmadeusToken();
      
      const url = `${AMADEUS_CONFIG.BASE_URL}/reference-data/locations`;
      const searchParams = new URLSearchParams({
        subType: 'AIRPORT,CITY',
        keyword: query,
        'page[limit]': '8', // Reduced to save quota
        'page[offset]': '0',
        view: 'LIGHT',
      });

      console.log('📤 API Request URL:', `${url}?${searchParams.toString()}`);

      const response = await axios.get(`${url}?${searchParams.toString()}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
        timeout: 5000,
      });

      console.log('✅ Successfully received airport suggestions');
      
      if (response.data?.data && Array.isArray(response.data.data)) {
        const suggestions = response.data.data
          .filter((location: any) => location.iataCode && location.name)
          .map((location: any) => ({
            code: location.iataCode,
            name: location.name,
            city: location.address?.cityName || 'Unknown',
          }))
          .filter((suggestion: {code: string, name: string, city: string}, index: number, self: Array<{code: string, name: string, city: string}>) => 
            index === self.findIndex((s: {code: string, name: string, city: string}) => s.code === suggestion.code)
          )
          .slice(0, 8); // Limit to 8
        
        console.log(`📍 Processed ${suggestions.length} unique airport suggestions`);
        
        // Cache for 7 days (airport data rarely changes)
        APICacheManager.set(cacheKey, suggestions, 168);
        
        console.groupEnd();
        return suggestions;
      }
      
      console.warn('⚠️ No airport data in response');
      return [];
      
    } catch (error) {
      console.error('❌ Airport search failed:', error);
      
      if (axios.isAxiosError(error)) {
        console.error('📡 API Error:', {
          status: error.response?.status,
          statusText: error.response?.statusText,
        });
        
        // If API fails, use mock data
        console.log('🔄 Falling back to mock airport suggestions');
        const mockSuggestions = this.getMockAirportSuggestions(query);
        console.groupEnd();
        return mockSuggestions;
      }
      
      console.groupEnd();
      throw error;
    }
  }

  // ==================== ENHANCED MOCK GENERATION ====================
  /**
   * Generate enhanced mock flights based on real price data
   */
  private static async generateEnhancedMockFlights(
    params: SearchParams, 
    basePrice?: number
  ): Promise<Flight[]> {
    console.group('🎨 Enhanced Mock Flight Generation');
    console.log('📋 Route:', `${params.origin} → ${params.destination}`);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    const flights: Flight[] = [];
    const actualBasePrice = basePrice || 200 + Math.random() * 800;
    
    console.log('💰 Base price for mock generation:', `$${Math.round(actualBasePrice)}`);
    
    // Generate 12-18 realistic mock flights
    const flightCount = 12 + Math.floor(Math.random() * 6);
    
    for (let i = 0; i < flightCount; i++) {
      const airline = MOCK_AIRLINES[Math.floor(Math.random() * MOCK_AIRLINES.length)];
      const stops = Math.random() > 0.6 ? 1 : Math.random() > 0.85 ? 2 : 0;
      
      // Generate realistic departure times (6 AM to 10 PM)
      const departureHour = 6 + Math.floor(Math.random() * 16);
      const durationMinutes = this.calculateRealisticDuration(
        params.origin,
        params.destination,
        stops
      );
      
      // Price variation based on base price (±25%)
      const priceVariation = 0.75 + Math.random() * 0.5;
      const price = Math.round(actualBasePrice * priceVariation);
      
      const flight: Flight = {
        id: `ENHANCED-${Date.now()}-${i}`,
        airline: airline.name,
        airlineLogo: airline.code,
        flightNumber: `${airline.code}${Math.floor(100 + Math.random() * 900)}`,
        origin: params.origin,
        destination: params.destination,
        departureTime: `${departureHour.toString().padStart(2, '0')}:${(Math.random() > 0.5 ? '00' : '30')}`,
        arrivalTime: this.calculateArrivalTime(departureHour, durationMinutes),
        duration: durationMinutes,
        price: price,
        stops,
        stopDetails: stops > 0 ? this.generateRealisticStopDetails(stops) : undefined,
        aircraft: this.getRandomAircraft(),
      };

      flights.push(flight);
      
      if (i < 3) { // Log first 3 flights as sample
        console.log(`✈️ Sample flight ${i + 1}:`, {
          airline: flight.airline,
          price: `$${flight.price}`,
          stops: flight.stops,
          departure: flight.departureTime,
        });
      }
    }

    // Sort by price (cheapest first)
    const sortedFlights = flights.sort((a, b) => a.price - b.price);
    
    console.log(`✅ Generated ${sortedFlights.length} enhanced mock flights`);
    console.log('📈 Price statistics:', {
      min: `$${sortedFlights[0]?.price || 0}`,
      max: `$${sortedFlights[sortedFlights.length - 1]?.price || 0}`,
      avg: `$${Math.round(sortedFlights.reduce((sum, f) => sum + f.price, 0) / sortedFlights.length)}`,
    });
    console.groupEnd();
    
    return sortedFlights;
  }

  // ==================== HELPER METHODS ====================
  private static calculateRealisticDuration(origin: string, destination: string, stops: number): number {
    // Mock realistic flight durations
    const baseDuration = 90 + Math.random() * 300; // 1.5 to 6.5 hours
    const stopPenalty = stops * 120; // 2 hours per stop
    return Math.round(baseDuration + stopPenalty);
  }

  private static generateRealisticStopDetails(stops: number) {
    const commonHubs = ['ATL', 'ORD', 'DFW', 'DEN', 'LAX', 'JFK', 'MIA', 'SEA'];
    const stopAirports = [];
    
    for (let i = 0; i < stops; i++) {
      stopAirports.push({
        airport: commonHubs[Math.floor(Math.random() * commonHubs.length)],
        duration: 60 + Math.floor(Math.random() * 120), // 1-3 hour layover
      });
    }
    
    return stopAirports;
  }

  private static getRandomAircraft(): string {
    const aircraft = [
      'Boeing 737',
      'Airbus A320',
      'Boeing 787',
      'Airbus A350',
      'Boeing 777',
      'Airbus A330',
      'Embraer E190',
      'Bombardier CRJ900',
    ];
    return aircraft[Math.floor(Math.random() * aircraft.length)];
  }

  private static calculateArrivalTime(departureHour: number, durationMinutes: number): string {
    const totalMinutes = departureHour * 60 + durationMinutes;
    const arrivalHour = Math.floor(totalMinutes / 60) % 24;
    const arrivalMinute = totalMinutes % 60;
    return `${arrivalHour.toString().padStart(2, '0')}:${arrivalMinute.toString().padStart(2, '0')}`;
  }

  // ==================== MOCK DATA GENERATORS ====================
  private static getMockInspirationData(origin: string, maxPrice: number, oneWay: boolean): any {
    const mockDestinations = [
      { code: 'LAX', city: 'Los Angeles', basePrice: 280 },
      { code: 'ORD', city: 'Chicago', basePrice: 220 },
      { code: 'MIA', city: 'Miami', basePrice: 190 },
      { code: 'SEA', city: 'Seattle', basePrice: 320 },
      { code: 'DEN', city: 'Denver', basePrice: 250 },
      { code: 'ATL', city: 'Atlanta', basePrice: 210 },
      { code: 'DFW', city: 'Dallas', basePrice: 230 },
      { code: 'SFO', city: 'San Francisco', basePrice: 350 },
      { code: 'LHR', city: 'London', basePrice: 550 },
      { code: 'CDG', city: 'Paris', basePrice: 520 },
    ];
    
    const data = mockDestinations
      .filter(dest => dest.basePrice <= maxPrice)
      .map(dest => {
        const departureDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
        const returnDate = oneWay ? undefined : new Date(departureDate.getTime() + 7 * 24 * 60 * 60 * 1000);
        
        return {
          type: 'flight-destination',
          origin: origin,
          destination: dest.code,
          departureDate: departureDate.toISOString().split('T')[0],
          returnDate: returnDate?.toISOString().split('T')[0],
          price: {
            total: (dest.basePrice + Math.random() * 50).toFixed(2),
          },
          links: {
            flightDates: `https://test.api.amadeus.com/v1/shopping/flight-dates?origin=${origin}&destination=${dest.code}`,
            flightOffers: `https://test.api.amadeus.com/v2/shopping/flight-offers?originLocationCode=${origin}&destinationLocationCode=${dest.code}`,
          },
        };
      });
    
    return {
      data,
      meta: { count: data.length },
      dictionaries: {
        locations: {},
        currencies: { USD: 'US DOLLAR' },
        carriers: {},
      },
    };
  }

  private static getMockPriceTrendsForRoute(origin: string, destination: string): PriceDataPoint[] {
    const trends: PriceDataPoint[] = [];
    const basePrice = 300; // Default base price
    
    // Generate 7 days of price trends
    for (let i = 0; i < 7; i++) {
      const date = new Date();
      date.setDate(date.getDate() + i);
      
      // Realistic price fluctuations
      const fluctuation = 0.8 + (Math.random() * 0.4);
      const price = Math.round(basePrice * fluctuation);
      
      trends.push({
        date: date.toISOString().split('T')[0],
        price,
        airline: MOCK_AIRLINES[Math.floor(Math.random() * MOCK_AIRLINES.length)].name,
      });
    }
    
    return trends;
  }

  private static getMockAirportSuggestions(query: string): Array<{code: string, name: string, city: string}> {
    if (!query) return [];
    
    return MOCK_AIRPORTS
      .filter(airport => 
        airport.code.toLowerCase().includes(query.toLowerCase()) ||
        airport.city.toLowerCase().includes(query.toLowerCase()) ||
        airport.name.toLowerCase().includes(query.toLowerCase())
      )
      .slice(0, 8);
  }

  // ==================== API STATUS CHECK ====================
  static async checkAPIStatus(): Promise<{ available: boolean; usingMock: boolean; message: string }> {
    console.group('🔍 API Status Check');
    
    if (AMADEUS_CONFIG.MOCK_MODE) {
      console.log('🎭 MOCK MODE: Using mock data (configured in .env)');
      console.groupEnd();
      return {
        available: false,
        usingMock: true,
        message: 'Using mock data (configured)',
      };
    }

    // Check credentials
    if (!AMADEUS_CONFIG.API_KEY || AMADEUS_CONFIG.API_KEY === 'YOUR_API_KEY_HERE' ||
        !AMADEUS_CONFIG.API_SECRET || AMADEUS_CONFIG.API_SECRET === 'YOUR_API_SECRET_HERE') {
      console.log('🔑 No Amadeus API credentials found in .env');
      console.log('💡 Add credentials to .env for real API access');
      console.groupEnd();
      return {
        available: false,
        usingMock: true,
        message: 'No API credentials configured',
      };
    }

    try {
      console.log('🌐 Testing Amadeus API connection...');
      const token = await getAmadeusToken();
      const isAuthenticated = !!token;
      
      // Test a simple API call
      console.log('🧪 Testing Airport Search API...');
      const testSuggestions = await this.getAirportSuggestions('JFK');
      
      console.log(`✅ Amadeus API is ${isAuthenticated ? 'available' : 'not available'}`);
      console.log(`📊 Airport Search working: ${testSuggestions.length} suggestions found`);
      
      const message = isAuthenticated 
        ? `Amadeus API connected. Caching enabled to conserve quota (39 calls/month).` 
        : 'Amadeus API unavailable';
      
      console.groupEnd();
      return {
        available: isAuthenticated,
        usingMock: !isAuthenticated,
        message,
      };
    } catch (error) {
      console.warn('⚠️ Amadeus API check failed:', error);
      console.log('🔄 Will use hybrid approach with caching');
      console.groupEnd();
      return {
        available: false,
        usingMock: true,
        message: 'Amadeus API check failed, using hybrid approach',
      };
    }
  }

  // ==================== CACHE MANAGEMENT ====================
  /**
   * Clear all API caches
   */
  static clearCache(): void {
    APICacheManager.clearAll();
    APIRateLimiter.resetDailyCount();
    tokenInfo = null; // Also clear token cache
    console.log('🗑️ Cleared all API caches and tokens');
  }

  /**
   * Get cache statistics
   */
  static getCacheStats(): { total: number; keys: string[] } {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(APICacheManager['CACHE_PREFIX'])
    );
    
    return {
      total: keys.length,
      keys: keys.map(key => key.replace(APICacheManager['CACHE_PREFIX'], '')),
    };
  }

  // ==================== RATE LIMIT INFO ====================
  /**
   * Get rate limit information
   */
  static getRateLimitInfo() {
    return APIRateLimiter.getStats();
  }
}