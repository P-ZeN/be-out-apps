// Mapbox Geocoding Service
const MAPBOX_TOKEN =
    import.meta.env.VITE_MAPBOX_ACCESS_TOKEN ||
    "pk.eyJ1IjoiYmVvdXQiLCJhIjoiY2x0ZXhzZHl6MGNjYjJqbzJudjJkOWNiZiJ9.example";
const GEOCODING_API_URL = "https://api.mapbox.com/geocoding/v5/mapbox.places";

export class GeocodingService {
    static async searchPlaces(query, options = {}) {
        const {
            proximity = "2.3522,48.8566", // Paris as default proximity
            country = "fr",
            types = "place,locality,neighborhood,address,poi",
            limit = 5,
        } = options;

        try {
            const url = new URL(`${GEOCODING_API_URL}/${encodeURIComponent(query)}.json`);
            url.searchParams.append("access_token", MAPBOX_TOKEN);
            url.searchParams.append("proximity", proximity);
            url.searchParams.append("country", country);
            url.searchParams.append("types", types);
            url.searchParams.append("limit", limit);
            url.searchParams.append("language", "fr");

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Geocoding API error: ${response.status}`);
            }

            const data = await response.json();
            return data.features.map((feature) => ({
                id: feature.id,
                text: feature.text,
                place_name: feature.place_name,
                center: feature.center,
                bbox: feature.bbox,
                context: feature.context || [],
            }));
        } catch (error) {
            console.error("Geocoding search error:", error);
            return [];
        }
    }

    static async reverseGeocode(longitude, latitude) {
        try {
            const url = new URL(`${GEOCODING_API_URL}/${longitude},${latitude}.json`);
            url.searchParams.append("access_token", MAPBOX_TOKEN);
            url.searchParams.append("types", "place,locality,neighborhood,address");
            url.searchParams.append("language", "fr");

            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Reverse geocoding API error: ${response.status}`);
            }

            const data = await response.json();
            return data.features[0] || null;
        } catch (error) {
            console.error("Reverse geocoding error:", error);
            return null;
        }
    }

    static async getCurrentLocation() {
        return new Promise((resolve, reject) => {
            if (!navigator.geolocation) {
                reject(new Error("Geolocation is not supported by this browser."));
                return;
            }

            navigator.geolocation.getCurrentPosition(
                async (position) => {
                    const { latitude, longitude } = position.coords;
                    try {
                        const location = await this.reverseGeocode(longitude, latitude);
                        resolve({
                            latitude,
                            longitude,
                            address: location ? location.place_name : `${latitude}, ${longitude}`,
                        });
                    } catch (error) {
                        resolve({
                            latitude,
                            longitude,
                            address: `${latitude}, ${longitude}`,
                        });
                    }
                },
                (error) => {
                    reject(new Error(`Geolocation error: ${error.message}`));
                },
                {
                    enableHighAccuracy: true,
                    timeout: 10000,
                    maximumAge: 300000, // 5 minutes
                }
            );
        });
    }

    static calculateDistance(lat1, lng1, lat2, lng2) {
        const R = 6371; // Earth's radius in kilometers
        const dLat = this.deg2rad(lat2 - lat1);
        const dLng = this.deg2rad(lng2 - lng1);
        const a =
            Math.sin(dLat / 2) * Math.sin(dLat / 2) +
            Math.cos(this.deg2rad(lat1)) * Math.cos(this.deg2rad(lat2)) * Math.sin(dLng / 2) * Math.sin(dLng / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        const distance = R * c;
        return distance;
    }

    static deg2rad(deg) {
        return deg * (Math.PI / 180);
    }

    static formatDistance(distance) {
        if (distance < 1) {
            return `${Math.round(distance * 1000)}m`;
        } else {
            return `${distance.toFixed(1)}km`;
        }
    }
}

export default GeocodingService;
