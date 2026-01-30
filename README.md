
# SkySearch Flight App

SkySearch is a modern, production-ready flight search application built with React and TypeScript. It integrates with the Amadeus Flight APIs while implementing smart caching, rate limiting, and graceful degradation patterns. The application helps users discover flight destinations and find the best deals while efficiently managing API usage within free tier limits.


## Key Features
- **Destination Discovery:** Explore places you can fly from any airport with real pricing.
- **Smart Flight Search:** Find flights with detailed information and filtering options
- **Price Trend Analysis:** Visualize price fluctuations over time with interactive charts
- **Graceful Fallbacks:** Seamlessly switches to mock data during API failures
- **Responsive Design:** Beautiful UI that works on all devices
- **Real-time Filtering:** Instant filtering by price, airlines, stops, and departure times
- **Airport Auto-suggestions:** Intelligent airport search with offline fallback.

## Architecture & Technology Stack
### Fronted
- React 18 with TypeScript for type-safe development
- Tailwind CSS for utility-first styling
- Recharts for data visualization
- Axios for HTTP requests
- Lucide React for icons

### API Integration
- Amadeus Flight APIs - `Flight Inspiration Search`, `Flight Cheapest Date Search`, `Airport & Location Search`

### State Management
- Custom React hooks for centralized state.
- LocalStorage for persistent caching.
- React Context for theme/future global state.


## Environment Configuration
Create a new file named `.env.local` in the root of your project and add the following content:
```env
Amadeus API Credentials (Get from https://developers.amadeus.com)
REACT_APP_AMADEUS_API_KEY=your_api_key_here
REACT_APP_AMADEUS_API_SECRET=your_api_secret_here

Development Mode
REACT_APP_USE_MOCK_DATA=false  # Set to false to try real API first, fallback to mock
```

## Screenshots
### Search and Discover 
![Search & Discover Destination](https://github.com/Nzaya/Flight-search/blob/main/src/public/images/r.png?raw=true)

### Search, PriceTrend & Filters 
![Search, PriceTrend & Filters](https://github.com/Nzaya/Flight-search/blob/main/src/public/images/q.png?raw=true)

## Run Locally
Clone the project
```bash
  git clone the project
```
Go to the project directory
```bash
  cd my-project
```
Install dependencies
```bash
  npm install
```
Start the server
```bash
  npm start
```


