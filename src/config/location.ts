import * as opencage from 'opencage-api-client';

const apiKey: string = '085b73518d6f4ce9bced1ee855f54a68';

export const findLocation = async (postalCode: string)=>{
    const options: any = {
      key: apiKey,
      q: 'Rua Joaquim Souza Lobo, 517, SC, Brazil',
    };
    opencage.geocode(options)
      .then((response: any) => {
        console.log(response)
        if (response && response.results && response.results.length > 0) {
          const { lat, lng } = response.results[0].geometry;
          console.log(`Latitude: ${lat}, Longitude: ${lng}`);
        } else {
          console.error('No results found for the provided postal code.');
        }
      })
      .catch((error: Error) => {
        console.error('Error:', error.message || error);
      });
} 


