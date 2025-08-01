const axios = require('axios');
const { getRandomCoordinate } = require('./locationHelper');
require('dotenv').config();

const API_KEY = process.env.GOOGLE_MAPS_API_KEY;

if (!API_KEY) {
    throw new Error("GOOGLE_MAPS_API_KEY is not defined in server/.env");
}

/**
 * Belirtilen bir konumda geçerli bir Google Street View panoraması olup olmadığını kontrol eder.
 * @param {object} location - {lat, lng} formatında konum nesnesi.
 * @returns {Promise<object|null>} Geçerli konum bulunursa {lat, lng}, bulunamazsa null döner.
 */
const findStreetViewLocation = async (location) => {
    const url = `https://maps.googleapis.com/maps/api/streetview/metadata`;
    try {
        const response = await axios.get(url, {
            params: {
                location: `${location.lat},${location.lng}`,
                radius: 50000, // 50km gibi geniş bir yarıçapla ara
                source: 'outdoor',
                key: API_KEY,
            },
            timeout: 5000,
        });

        if (response.data && response.data.status === 'OK') {
            return response.data.location;
        }
        return null;

    } catch (error) {
        console.error(`[ERROR] Street View Metadata API request failed: ${error.message}`);
        return null;
    }
};

/**
 * Belirtilen bir bölgede gerçekten rastgele bir Street View konumu bulur.
 * @param {string} region - 'world', 'europe' gibi bir bölge adı.
 * @returns {Promise<object>} Geçerli bir konum nesnesi {lat, lng}.
 * @throws {Error} Maksimum deneme sayısına ulaşıldığında hata fırlatır.
 */
const getRandomStreetViewLocation = async (region = 'world') => {
    let attempts = 0;
    const maxAttempts = 100; // Deneme sayısını artıralım

    console.log(`[LOCATION] Searching for a random location in '${region}'...`);

    while (attempts < maxAttempts) {
        attempts++;
        // 1. Adım: Bölgeye uygun, tamamen rastgele bir koordinat üret
        const randomCoord = getRandomCoordinate(region);
        
        try {
            // 2. Adım: Bu koordinatın etrafında bir panorama ara
            const location = await findStreetViewLocation(randomCoord); 

            if (location) {
                console.log(`[LOCATION] Found a valid location in ${attempts} attempts:`, location);
                return location;
            }
            // Konum bulunamadıysa (null döndü), döngü devam edecek...

        } catch (error) {
            // Hata zaten findStreetViewLocation içinde loglandı, döngü devam etmeli.
        }
    }

    console.error(`[FATAL] Could not find a valid location in '${region}' after ${maxAttempts} attempts.`);
    throw new Error("Could not find a valid Street View location after maximum attempts.");
};

module.exports = { getRandomStreetViewLocation };
