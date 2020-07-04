const { Client } = require('@googlemaps/google-maps-services-js');

const API_KEY = ''
const mapsClient = new Client({});

class MapsAPI {

  static async getDistances(customerLocation, providerLocations) {
    console.log('mapsapi getdistances invoked');
    return null;
  }

  static async getCoordinates(address) {
    console.log('mapsapi getcoords invoked for', address);
    return address;
  }

}

module.exports = MapsAPI;
