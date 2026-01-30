import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function handler(
  req: VercelRequest,
  res: VercelResponse
) {
  try {
    // 1. Request OAuth token from Amadeus
    const tokenResponse = await fetch(
      "https://test.api.amadeus.com/v1/security/oauth2/token",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded"
        },
        body: new URLSearchParams({
          grant_type: "client_credentials",
          client_id: process.env.AMADEUS_API_KEY ?? "",
          client_secret: process.env.AMADEUS_API_SECRET ?? ""
        })
      }
    );

    if (!tokenResponse.ok) {
      const details = await tokenResponse.text();
      return res.status(500).json({
        error: "Failed to obtain Amadeus access token",
        details
      });
    }

    const tokenData = await tokenResponse.json();
    const accessToken: string = tokenData.access_token;

    // 2. Fetch flight offers
    const flightsResponse = await fetch(
      "https://test.api.amadeus.com/v2/shopping/flight-offers",
      {
        headers: {
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!flightsResponse.ok) {
      const details = await flightsResponse.text();
      return res.status(500).json({
        error: "Failed to fetch flight offers",
        details
      });
    }

    const flightsData = await flightsResponse.json();

    // 3. Return data
    res.status(200).json(flightsData);
  } catch (error) {
    res.status(500).json({
      error: "Unexpected server error",
      message: (error as Error).message
    });
  }
}
