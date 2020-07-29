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
const MATCH_LIMIT = 10;

// insert array of providerIDs into db orderid
const providerStack = [];

// perform googlemaps distancematrix request to obtain
// driving time estimations
// add results to queue sorted by shortest driving time first

// only notify provider if they are available
// (keep all providers regardless of availability in queue because
// their status may change during the search process)

class ProviderFinder {

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

    // for each result, push to stack

    // maintain stack in db as array in orderId

  }

  static async pushProvider(id, stack) {
    // this.updateStack()
    return;
  }

  static async popProvider(id, stack) {
    // this.updateStack()
    return;
  }

  static async updateStack(orderId, stack) {
    // perform db update
    return;
  }

  static async notifyProvider(id) {
    // update db.provider.accept_pending with orderId
    // await Order.updateStatus
    // const [providerRes, orderRes] = await Promise.all([Provider.acceptPending, Order.updateStatus])
    return;
  }

  static async updateCustomerStatus(custId, orderId) {
    return;
  }

}

module.exports = ProviderFinder;
