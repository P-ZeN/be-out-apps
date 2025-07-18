// Mapbox Geocoding Service

// Function to get Mapbox token with multiple fallback strategies
const getMapboxToken = () => {
    // Strategy 1: Vite build-time environment variable
    const buildTimeToken = import.meta.env.VITE_MAPBOX_ACCESS_TOKEN;
    if (buildTimeToken && buildTimeToken !== "%VITE_MAPBOX_ACCESS_TOKEN%" && !buildTimeToken.includes("undefined")) {
        return buildTimeToken;
    }

    // Strategy 2: Runtime environment variable (for Docker/server environments)
    if (typeof window !== "undefined" && window.ENV && window.ENV.VITE_MAPBOX_ACCESS_TOKEN) {
        const runtimeToken = window.ENV.VITE_MAPBOX_ACCESS_TOKEN;
        if (runtimeToken !== "%VITE_MAPBOX_ACCESS_TOKEN%" && !runtimeToken.includes("undefined")) {
            return runtimeToken;
        }
    }

    // Strategy 3: Check if running in production and try to get from meta tag
    if (typeof document !== "undefined") {
        const metaToken = document.querySelector('meta[name="mapbox-token"]');
        if (metaToken) {
            const tokenContent = metaToken.getAttribute("content");
            if (tokenContent && tokenContent !== "%VITE_MAPBOX_ACCESS_TOKEN%" && !tokenContent.includes("undefined")) {
                return tokenContent;
            }
        }
    }

    // Strategy 4: Fallback token
    return "pk.eyJ1IjoicGhpbGlwcGV6ZW5vbmUiLCJhIjoiY21jeXQyemdpMHRwazJrc2JkdG9vZzViaCJ9.0h5JWCXgM5nY6hrDtj-vsw";
};

const MAPBOX_TOKEN = getMapboxToken();
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

            console.log("Geocoding request:", {
                url: url.toString(),
                token: MAPBOX_TOKEN,
                tokenLength: MAPBOX_TOKEN?.length,
                userAgent: typeof navigator !== "undefined" ? navigator.userAgent : "unknown",
            });

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
