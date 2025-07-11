# Map Functionality Implementation Guide

## Overview
The map functionality has been implemented using **Mapbox GL JS** with React integration. This provides an interactive map for displaying events with their locations, user geolocation, and address search capabilities.

## Features Implemented

### 🗺️ Interactive Map
- **Mapbox GL JS** with custom styling
- Event markers with category-based colors
- Event popup with details on marker click
- Zoom controls and navigation
- Responsive design for mobile and desktop

### 📍 Geolocation
- **Current location detection** with user permission
- User location marker on map
- Automatic map centering on user location

### 🔍 Address Search
- **Mapbox Geocoding API** integration
- Autocomplete suggestions
- Support for French addresses and POIs
- Debounced search (300ms) for performance

### 🎯 Event Display
- **Category-based marker colors**:
  - Music: Pink (#e91e63)
  - Sport: Blue (#2196f3)
  - Theater: Purple (#9c27b0)
  - Cinema: Orange (#ff5722)
  - Conference: Blue Grey (#607d8b)
  - Festival: Orange (#ff9800)
- **Last-minute indicators** with special badges
- **Distance calculation** from user location
- **Event clustering** for better performance (future enhancement)

## Setup Instructions

### 1. Get Mapbox Access Token
1. Go to [Mapbox](https://www.mapbox.com/)
2. Create a free account
3. Go to Account → Access Tokens
4. Create a new token or use the default public token
5. Copy the token

### 2. Configure Environment
1. Copy `.env.example` to `.env`:
   ```bash
   cp .env.example .env
   ```
2. Replace the Mapbox token:
   ```bash
   VITE_MAPBOX_ACCESS_TOKEN=pk.your_actual_token_here
   ```

### 3. Install Dependencies (Already Done)
The required packages are already installed:
- `mapbox-gl` - Core Mapbox library
- `react-map-gl` - React wrapper for Mapbox

## File Structure

```
client/src/
├── components/
│   ├── MapComponent.jsx         # Main map component
│   └── AddressSearch.jsx        # Address search with autocomplete
├── services/
│   └── geocodingService.js      # Mapbox geocoding API wrapper
├── hooks/
│   └── useDebounce.js          # Debounce hook for search
└── pages/
    └── MapView.jsx             # Main map page
```

## API Usage

### GeocodingService Methods

```javascript
// Search for places
const results = await GeocodingService.searchPlaces('Paris', {
    proximity: '2.3522,48.8566', // Bias towards Paris
    country: 'fr',                // Limit to France
    limit: 5                      // Max 5 results
});

// Reverse geocoding (coordinates to address)
const location = await GeocodingService.reverseGeocode(2.3522, 48.8566);

// Get current user location
const userLocation = await GeocodingService.getCurrentLocation();

// Calculate distance between two points
const distance = GeocodingService.calculateDistance(lat1, lng1, lat2, lng2);
const formatted = GeocodingService.formatDistance(distance); // "2.5km"
```

## Map Component Props

```javascript
<MapComponent
    events={filteredEvents}           // Array of events with lat/lng
    onEventClick={handleEventClick}   // Callback when event marker clicked
    selectedEventId={selectedEventId} // Currently selected event ID
    center={{ lat: 48.8566, lng: 2.3522 }} // Map center
    zoom={12}                         // Initial zoom level
/>
```

## Event Data Structure

```javascript
const event = {
    id: 1,
    title: "Concert Jazz au Sunset",
    category: "music",              // Used for marker color
    discountedPrice: 25,
    originalPrice: 45,
    discount: 44,
    distance: "2.5 km",            // Calculated dynamically
    location: "Paris 18e",
    isLastMinute: true,            // Shows special badge
    lat: 48.8566,                  // Required for map
    lng: 2.3522                    // Required for map
};
```

## Performance Considerations

### Current Optimizations
- **Debounced search** (300ms delay)
- **Request cancellation** for search
- **Reusable maps** with `reuseMaps` prop
- **Lazy loading** of map tiles

### Future Enhancements
- **Event clustering** for large datasets
- **Virtualization** for event lists
- **Caching** of geocoding results
- **Progressive loading** of map tiles

## Mobile Responsiveness

The map is fully responsive:
- **Touch gestures** supported (pinch to zoom, pan)
- **Mobile-optimized controls**
- **Responsive grid layout** (full width on mobile)
- **Touch-friendly** marker sizes

## Accessibility

- **Keyboard navigation** support
- **Screen reader** compatible
- **High contrast** markers
- **Alternative text** for map elements

## Error Handling

- **Network errors** with user feedback
- **Geolocation permission** handling
- **Invalid coordinates** protection
- **API rate limiting** graceful degradation

## Browser Support

- **Modern browsers** (Chrome, Firefox, Safari, Edge)
- **WebGL support** required for Mapbox
- **Geolocation API** support for location features

## Cost Considerations

Mapbox free tier includes:
- **50,000 map loads** per month
- **100,000 geocoding requests** per month
- **2,500 directions requests** per month

For production, monitor usage and upgrade plan as needed.

## Troubleshooting

### Common Issues

1. **Map not loading**
   - Check Mapbox token is valid
   - Verify token has correct permissions
   - Check network connectivity

2. **Search not working**
   - Verify geocoding API access
   - Check rate limits
   - Ensure proper token configuration

3. **Location not working**
   - Check HTTPS requirement for geolocation
   - Verify user permissions
   - Test on different devices

### Debug Mode
Add this to your .env for detailed logging:
```bash
VITE_DEBUG=true
```

## Next Steps

1. **Connect to real API** - Replace mock data with actual events
2. **Add filters** - Category, price range, distance filters
3. **Implement clustering** - For better performance with many events
4. **Add directions** - Route from user to event location
5. **Offline support** - Cache map tiles for offline usage
