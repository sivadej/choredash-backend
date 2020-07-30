// providerFinder
// once a new order is created, perform a search for
// nearest available providers, given coordinates
// of customer and search params

// perform googlemaps distancematrix request to obtain
// driving time estimations
// add results to queue sorted by shortest driving time first

// only notify provider if they are available
// (keep all providers regardless of availability in queue because
// their status may change during the search process)

const db = require('./../db');
const MapsApi = require('./../mapsApi/mapsApi');
const { ObjectId } = require('mongodb');
const { DB_NAME } = require('./../config');

const MATCH_LIMIT = 10;

const milesToMeters = (mi) => {
  return +mi * 1609.39;
};

class ProviderFinder {

  constructor(orderId, customerLoc) {
    this.providerStack = [];
    this.customerLoc = customerLoc;
    this.orderId = orderId;
    console.log('providerfinder instantiated');
  }
  
  getMatches = async (radiusMiles = 10) => {
    console.log('returning all matches');
    console.log('customer loc', this.customerLoc);
    const { lat, lng } = this.customerLoc;
    const result = await db
      .db(DB_NAME)
      .collection('providers')
      .find({
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: [lng, lat] },
            $maxDistance: milesToMeters(radiusMiles),
            $minDistance: 0,
          },
        },
      })
      .toArray();
    if (result.length > 0) {
      this.providerStack.push(result);
      return this.providerStack;
    }
    else return 'no nearby matches found. increase your search radius.';
  };

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