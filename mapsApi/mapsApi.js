// wrapper for google maps API

const { Client } = require('@googlemaps/google-maps-services-js');
const { MAPS_API_KEY } = require('./apiConfig');

const mapsClient = new Client({});

class MapsAPI {
  static async getDistances(customerLocation, providerLocations) {
    console.log('mapsapi getdistances invoked');
    try {
      const apiResponse = await mapsClient.distancematrix({
        params: {
          origins: providerLocations,
          destinations: customerLocation,
          key: MAPS_API_KEY,
        },
        timeout: 3000,
      });
      return apiResponse.data;
    } catch (err) {
      console.log('error', err);
    }
  }

  // getCoordinates(address)
  // Params: Object { line1, line2, city, state, zip }
  static async getCoordinates(address) {
    console.log('mapsapi getcoords invoked for', address);
    const addressString = `${address.line1} ${address.line2} ${address.city} ${address.state} ${address.zip}`;
    try {
      const apiResponse = await mapsClient.geocode({
        params: {
          address: addressString,
          key: MAPS_API_KEY,
        },
        timeout: 3000,
      });
      return apiResponse.data;
    } catch (err) {
      console.log('error', err);
    }
  }
}

module.exports = MapsAPI;
