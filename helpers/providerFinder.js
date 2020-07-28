// providerFinder
// once a new order is created, perform a search for
// nearest available providers, given coordinates
// of customer and search params
const db = require('../db');
const MapsApi = require('./../mapsApi/mapsApi');
const { ObjectId } = require('mongodb');
const { DB_NAME } = require('./../config');

// utilize mongodb geospacial queries to limit search range
const SEARCH_RANGE_IN_MI = 20;
// create queue of best matches.
const QUEUE_MATCH_LIMIT = 10;

// insert array of providerIDs into db orderid
const providerQueue = [];

// perform googlemaps distancematrix request to obtain
// driving time estimations
// add results to queue sorted by shortest driving time first

// only notify provider if they are available
// (keep all providers regardless of availability in queue because
// their status may change during the search process)

class ProviderFinder{

  static async getNearest(custCoords, maxDist) {
    // provider db query params - coord distance, availability
    // pass in customer coordinates
    const result = await db.providers.find({
      current_location: {
        $near: { $geometry: { type: 'Point', coordinates: [-1.11, 1.11] }},
        $minDistance: 0,
        $maxDistance: 5000,
      }
    })
  }

  static async enqueueProvider(id, queue) {
    return;
  }

  static async dequeueProvider(id, queue) {
    return;
  }

  static async notifyProvider(id) {
    return;
  }

  static async updateCustomerStatus(custId, orderId) {
    return;
  }

}
