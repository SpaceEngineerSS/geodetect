let geocoder = null;

const getGeocoder = () => {
  if (!geocoder) {
    if (window.google && window.google.maps) {
      geocoder = new window.google.maps.Geocoder();
    } else {
      throw new Error("Google Maps Geocoder not available.");
    }
  }
  return geocoder;
};

const parseAddress = (results) => {
    if (results && results.length > 0) {
        const address = {
            city: null,
            country: null,
        };

        // En spesifik sonuçtan en genele doğru adres bileşenlerini ara
        for (const result of results) {
            for (const component of result.address_components) {
                if (!address.city && (component.types.includes('locality') || component.types.includes('administrative_area_level_2'))) {
                    address.city = component.long_name;
                }
                if (!address.country && component.types.includes('country')) {
                    address.country = component.long_name;
                }
            }
        }
        
        // Şehir bulunamazsa, daha genel bir idari bölgeyi kullan
        if (!address.city) {
             for (const result of results) {
                for (const component of result.address_components) {
                    if (component.types.includes('administrative_area_level_1')) {
                        address.city = component.long_name;
                        break;
                    }
                }
                if(address.city) break;
            }
        }

        const city = address.city || 'Bilinmeyen Bölge';
        const country = address.country || 'Bilinmeyen Ülke';

        return `${city}, ${country}`;
    }
    return 'Konum Adı Bulunamadı';
};


export const reverseGeocode = (latLng) => {
  return new Promise((resolve, reject) => {
    getGeocoder().geocode({ location: latLng }, (results, status) => {
      if (status === 'OK') {
        resolve(parseAddress(results));
      } else if (status === 'ZERO_RESULTS') {
        resolve('Konum Adı Bulunamadı');
      }
      else {
        reject(new Error(`Geocoder failed due to: ${status}`));
      }
    });
  });
};
