import type { VercelRequest, VercelResponse } from '@vercel/node';
import axios from 'axios';

type AmadeusTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
};

type FlightData = {
  // adjust fields according to your usage
  [key: string]: any;
};

// Mock flight data (fallback)
const mockFlightData: FlightData = {
  data: [
    { destination: 'LON', price: 500 },
    { destination: 'PAR', price: 450 },
    { destination: 'NYC', price: 550 },
  ],
};

export default async function handler(req: VercelRequest, res: VercelResponse) {
  console.log('🔹 Incoming request to /api/amadeus');

  const useMock = process.env.REACT_APP_USE_MOCK_DATA === 'true';
  if (useMock) {
    console.log('🔹 Using mock data (REACT_APP_USE_MOCK_DATA=true)');
    return res.status(200).json(mockFlightData);
  }

  const CLIENT_ID = process.env.AMADEUS_CLIENT_ID;
  const CLIENT_SECRET = process.env.AMADEUS_CLIENT_SECRET;

  console.log('🔹 CLIENT_ID:', CLIENT_ID ? '✔ Present' : '❌ Missing');
  console.log('🔹 CLIENT_SECRET:', CLIENT_SECRET ? '✔ Present' : '❌ Missing');

  if (!CLIENT_ID || !CLIENT_SECRET) {
    console.warn('⚠️ Missing credentials, falling back to mock data');
    return res.status(200).json(mockFlightData);
  }

  try {
    console.log('🔹 Requesting Amadeus OAuth token...');
    const tokenResponse = await axios.post<AmadeusTokenResponse>(
      'https://test.api.amadeus.com/v1/security/oauth2/token',
      new URLSearchParams({
        grant_type: 'client_credentials',
        client_id: CLIENT_ID,
        client_secret: CLIENT_SECRET,
      }).toString(),
      { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }
    );

    const accessToken = tokenResponse.data.access_token;
    console.log('🔹 Access token received ✔');

    console.log('🔹 Fetching flight inspiration...');
    const flightResponse = await axios.get(
      'https://test.api.amadeus.com/v1/shopping/flight-destinations',
      {
        headers: { Authorization: `Bearer ${accessToken}` },
        params: { origin: 'NYC' }, // make dynamic as needed
      }
    );

    console.log('🔹 Flight data fetched ✔');
    res.status(200).json(flightResponse.data);

  } catch (err: any) {
    console.error('❌ Failed to get Amadeus token or data:', err.response?.data || err.message || err);
    console.log('🔹 Falling back to mock data...');
    res.status(200).json(mockFlightData);
  }
}
