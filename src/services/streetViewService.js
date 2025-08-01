import { getRandomCoordinate } from './locationHelper';

let streetViewService = null;

const getStreetViewService = () => {
  if (!streetViewService) {
    if (window.google && window.google.maps) {
      streetViewService = new window.google.maps.StreetViewService();
    } else {
      throw new Error("Google Maps API not loaded");
    }
  }
  return streetViewService;
};

const findStreetViewLocation = (location) => {
  return new Promise((resolve, reject) => {
    getStreetViewService().getPanorama(
      {
        location,
        radius: 50000, // 50km
        source: 'outdoor',
      },
      (data, status) => {
        if (status === 'OK') {
          resolve(data.location.latLng.toJSON());
        } else {
          // 'ZERO_RESULTS' normal bir durum, hata olarak sayılmaz.
          reject(new Error(`StreetView status: ${status}`));
        }
      }
    );
  });
};

export const getRandomStreetViewLocation = async (region = 'world') => {
  let attempts = 0;
  const maxAttempts = 100;

  while (attempts < maxAttempts) {
    attempts++;
    const randomCoord = getRandomCoordinate(region);
    
    try {
      const location = await findStreetViewLocation(randomCoord);
      if (location) {
        return location;
      }
      // Konum bulunamadı, döngü devam edecek...
    } catch (error) {
      // getPanorama başarısız oldu (ZERO_RESULTS vb.), döngü devam edecek...
      // console.warn(`Attempt ${attempts} failed:`, error.message);
    }
  }

  throw new Error("Could not find a valid Street View location after maximum attempts.");
};
