import axios from 'axios';

export const fetchCoordinates = async (location) => {
    try {
        const response = await axios.get('https://nominatim.openstreetmap.org/search', {
            params: {
                q: location,
                format: 'json',
                limit: 1,
            }
        });

        if (response.data.length > 0) {
            const { lat, lon } = response.data[0];
            return { lat, lng: lon };
        }

        return null;
    } catch (error) {
        console.error('Geocoding error:', error);
        return null;
    }
};