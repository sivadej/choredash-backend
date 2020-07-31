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
const { DB_NAME } = require('./../config');

const Provider = require('./../models/provider')

const NUMBER_OF_STATUS_RETRIES = 3;
const STATUS_CHECK_DELAY_IN_MS = 5000;

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

  getMatches = async (radiusMiles = 15) => {
    console.log('returning all matches');
    console.log('customer loc', this.customerLoc);

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

    // recursion base case
    if (providerStack.length === 0) return console.log('did not find any available or accepted providers');

    console.log('notifyMatches() invoked...');
    let orderIdString = orderId.toString();
    console.log('order id', orderId);
    console.log(typeof(orderId));
    console.log(typeof(orderIdString));

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
      console.log('SKIP this match');
      return this.notifyMatches(providerStack, orderId);
    }
    
    console.log('setting status to waiting on', currentMatch.id)
    const statusUpdateRes = await Provider.setOrderStatus(currentMatch.id, orderIdString, 'waiting');

    console.log('NOT skipping..')
    
    console.log('set current provider status to waiting...',currentMatch.id);

    console.log('run timer function for this match', currentMatch);


    for (let i = 0; i < NUMBER_OF_STATUS_RETRIES; i++) {
      await new Promise((resolve) => setTimeout(resolve, STATUS_CHECK_DELAY_IN_MS));
      
      let res = await Provider.getStatus(currentMatch.id);
      console.log(`status of provider ${currentMatch.id}: ${res.status}`);
      if (res.status === 'accepted') return console.log('match found. return this:', currentMatch);
      if (res.status === 'rejected') return this.notifyMatches(providerStack, orderId);
    } 
    console.log('this provider timed out. reset provider status', currentMatch.id)
    const statusResetRes = await Provider.setOrderStatus(currentMatch.id, null, null);

    console.log('on to the next potential match...')
    return this.notifyMatches(providerStack, orderId);
    
  };

}

module.exports = ProviderFinder;
