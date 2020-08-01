// providerFinder //

// once a new order is created, perform a search for
// nearest available providers, given coordinates
// of customer and search params

// perform googlemaps distancematrix request to obtain
// driving time estimations
// add results to queue sorted by shortest driving time first

const db = require('./../db');
const MapsApi = require('./../mapsApi/mapsApi');
const { DB_NAME } = require('./../config');

const Provider = require('./../models/provider');

const NUMBER_OF_STATUS_RETRIES = 12;
const STATUS_CHECK_DELAY_IN_MS = 500;
const DEFAULT_SEARCH_RADIUS_MI = 15;

const milesToMeters = (mi) => {
  return +mi * 1609.39;
};

class ProviderFinder {
  constructor(orderId, customerLoc) {
    this.providerStack = [];
    this.providerLocs = [];
    this.customerLoc = customerLoc;
    this.orderId = orderId;
    this.currentMatch;
  }

  getMatches = async (radiusMiles = DEFAULT_SEARCH_RADIUS_MI) => {
    console.log('returning all matches');
    console.log('customer loc', this.customerLoc);

    // 2dgraph geospatial query of provider locations from customer coordinates
    const result = await db
      .db(DB_NAME)
      .collection('providers')
      .find({
        available: true,
        location: {
          $near: {
            $geometry: { type: 'Point', coordinates: this.customerLoc },
            $maxDistance: milesToMeters(radiusMiles),
            $minDistance: 0,
          },
        },
      })
      .toArray();
    
    if (result.length===0) return null;

    if (result.length > 0) {
      console.log(`found ${result.length} nearby providers:`);
      // reverse [lat,lng] array for googlemaps api call
      this.providerLocs = result.map((p) => [p.location[1], p.location[0]]);
      result.forEach((p) => {
        this.providerStack.push({
          id: p._id.toString(),
          location: p.location,
        });
      });
      await this.insertDrivingDistances();
      this.sortMatches();
      return this.providerStack;
    } else return 'no nearby matches found. increase your search radius.';
  };

  // use googlemaps api to calculate driving distance.
  // insert into provider's object in stack.
  insertDrivingDistances = async () => {
    console.log('getting driving times from Google Maps...');
    const distanceResult = await MapsApi.getDistances(
      [[this.customerLoc[1], this.customerLoc[0]]],
      this.providerLocs
    );
    if (
      distanceResult.status === 'OK' &&
      distanceResult.rows.length === this.providerStack.length
    ) {
      this.providerStack.forEach((p, idx) => {
        p['duration_value'] =
          distanceResult.rows[idx].elements[0].duration.value;
        p['duration_text'] = distanceResult.rows[idx].elements[0].duration.text;
      });
      return;
    } else return 'error';
  };

  sortMatches = () => {
    console.log('sorting stack by shortest driving time last');
    return this.providerStack.sort(
      (a, b) => b.duration_value - a.duration_value
    );
  };

  // recursively pop stack of potential matches to notify each provider
  static async notifyMatches(providerStack, orderId) {
    console.log('notifyMatches() invoked for orderId', orderId);
    let orderIdString = orderId.toString();

    // recursion base case
    if (providerStack.length === 0) return this.handleNoMatchesFound(orderIdString);

    // set the current match by popping from the stack
    let currentMatch = providerStack.pop();
    console.log('popped from stack:', currentMatch)
    console.log('remaining stack:', providerStack)  
    console.log('check on currentMatch status as OK to proceed...')
    let status = await Provider.getStatus(currentMatch.id);
    console.log('skip if status is unavailable or current_order is not null')
    console.log('available?', status.available)
    console.log('current_order empty?', (status.current_order===null))
    if (status.available === false || status.current_order!==null) {
      console.log('SKIP this provider:', currentMatch.id);
      return this.notifyMatches(providerStack, orderId);
    }
    
    console.log('setting status to waiting on', currentMatch.id)
    await Provider.setOrderStatus(currentMatch.id, orderIdString, 'waiting');
    
    console.log('run timer loop for this potential match', currentMatch.id);
    for (let i = 0; i < NUMBER_OF_STATUS_RETRIES; i++) {
      await new Promise((resolve) => setTimeout(resolve, STATUS_CHECK_DELAY_IN_MS));
      
      let res = await Provider.getStatus(currentMatch.id);
      if (res === null) return this.notifyMatches(providerStack, orderId);

      console.log(`status of provider ${currentMatch.id}: ${res.status}`);

      if (res.status === 'accepted') {
        console.log('match found:', currentMatch.id);
        return this.handleMatchFound(currentMatch, orderId);
      }
      if (res.status === 'rejected') {
        await Provider.setOrderStatus(currentMatch.id, null, null);
        return this.notifyMatches(providerStack, orderIdString);
      }
    } 
    console.log('this provider timed out. reset provider status', currentMatch.id)
    await Provider.setOrderStatus(currentMatch.id, null, null);

    console.log('on to the next potential match...')
    return this.notifyMatches(providerStack, orderId);
    
  };

  static async handleMatchFound (providerData, orderId) {
    console.log('handling stuff for match found..')
    await Provider.handleMatchFound(providerData, orderId);
    return;
  }

  static async handleNoMatchesFound(orderId) {
    console.log('did not find any available or accepted providers', orderId);
    await Provider.handleNoMatchFound(orderId);
  }

}

module.exports = ProviderFinder;
