const { Client } = require("@googlemaps/google-maps-services-js");
require('dotenv').config();

const client = new Client({});
const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

const parseAddress = (results) => {
    if (results && results.length > 0) {
        const address = { city: null, country: null };
        const mostSpecificResult = results[0]; // Genellikle en doğru sonuç ilk sırada gelir.

        for (const component of mostSpecificResult.address_components) {
            if (component.types.includes('country')) {
                address.country = component.long_name;
            }
            if (component.types.includes('locality') || component.types.includes('administrative_area_level_1')) {
                address.city = component.long_name;
            }
        }
        
        const city = address.city || 'Bilinmeyen Bölge';
        const country = address.country || 'Bilinmeyen Ülke';
        return `${city}, ${country}`;
    }
    return 'Konum Adı Bulunamadı';
};

const reverseGeocode = async (latLng) => {
    if (!latLng) return 'Tahmin Yok';
    try {
        const response = await client.reverseGeocode({
            params: {
                latlng: latLng,
                key: API_KEY,
            },
        });
        return parseAddress(response.data.results);
    } catch (error) {
        console.error("Geocoding error:", error.response?.data?.error_message || error.message);
        return 'Adres Bulunamadı';
    }
};

module.exports = { reverseGeocode };
