import axios from 'axios';

const apiKey = 'YOUR_GOOGLE_MAPS_API_KEY';
const address = '456 Oak Avenue, Testburg, CA 56789, USA';

const apiUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(
  address
)}&key=${apiKey}`;

axios
  .get(apiUrl)
  .then((response) => {
    const location = response.data.results[0].geometry.location;
    console.log(`Latitude: ${location.lat}, Longitude: ${location.lng}`);
  })
  .catch((error) => {
    console.error('Error:', error.message || error);
  });
