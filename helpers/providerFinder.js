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

const Provider = require('./../models/provider')

const MATCH_LIMIT = 10;

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

  notifyProviderLoop = async () => {
    console.log('notifying providers...');
    if (this.providerStack.length === 0) return;

    // set the current match by popping from the stack
    this.currentMatch = this.providerStack.pop();
    if (!this.currentMatch) return;

    // call function to assign 'waiting' status to current providerId
    // only assign current_order property if provider is available
    let res = await Provider.setOrderStatus(this.currentMatch.id,this.orderId.toString(),'waiting');
    if (res === null) return this.notifyProviderLoop();

    // perform status check every 5 seconds for 1 minute
    for (let i = 0; i < 12; i++) {
      let status = await Provider.getStatus(this.currentMatch.id);
      if (status === null) return this.notifyProviderLoop();
      // accepted ? move on to active status
      if (status === 'accepted') {
        console.log('hooray! matched provider has accepted!');
        this.providerStack = [];
        return;
      }
      // rejected ? notify next provider
      if (status === 'rejected') {
        console.log('order rejected by this match... on to the next one...');
        await Provider.resetStatus(this.currentMatch.id);
        return this.notifyProviderLoop();
      }
      // currently set to unavailable ? next...
      if (status === 'unavailable') {
        console.log('matched but currently unavailable... skipping...');
        return this.notifyProviderLoop();
      }
      await new Promise((resolve) => setTimeout(resolve, 5000));
      // time out ? end loop
    }
    if (this.providerStack.length) return this.notifyProviderLoop();

    // entire stack has been exhausted, no further matches.
    // suggest searching with larger map radius
    return console.log('no providers available');
  };


  // recursively pop stack of matches
  static async notifyMatches(providerStack, orderId) {

    // recursion base case
    if (providerStack.length === 0) return console.log('end of recursion');


    console.log('notifyMatches() invoked...');
    let orderIdString = orderId.toString();
    console.log('order id', orderId);
    console.log(typeof(orderId));
    console.log(typeof(orderIdString));

    // set the current match by popping from the stack
    let currentMatch = providerStack.pop();
    console.log('popped from stack:', currentMatch)
    console.log('remaining stack:', providerStack)
    //if (!currentMatch) return null;

    // call function to assign 'waiting' status to current providerId
    // only assign current_order property if provider is available

  
    console.log('check on currentMatch status as OK to proceed...')
    let status = await Provider.getStatus(currentMatch.id);
    console.log('skip if status is unavailable or current_order is not null')
    console.log('available?', status.available)
    console.log('current_order empty?', (status.current_order===null))
    if (status.available === false || status.current_order!==null) {
      console.log('SKIP this match');
      return this.notifyMatches(providerStack, orderId);
    }
    else console.log('setting status to waiting on', currentMatch.id)

    console.log('NOT skipping..')
    
    console.log('set current provider status to waiting...',currentMatch.id);
    console.log('run timer function for this match', currentMatch);


    for (let i = 0; i < 5; i++) {
      await new Promise((resolve) => setTimeout(resolve, 1000));
      console.log('checking status of', currentMatch.id);
    }


    
    console.log('this provider timed out. resetting status', currentMatch.id)
    return this.notifyMatches(providerStack, orderId);
    // let res = await Provider.setOrderStatus(currentMatch.id, orderIdString, 'waiting');

    //console.log('status update result',res.modifiedCount)
    //if (res === null) return notifyProviderLoop();

    // perform status check every 5 seconds for 1 minute
    // for (let i = 0; i < 12; i++) {
    //   let status = await Provider.getStatus(currentMatch.id);
    //   if (status === null) return notifyProviderLoop();
    //   // accepted ? move on to active status
    //   if (status === 'accepted') {
    //     console.log('hooray! matched provider has accepted!');
    //     providerStack = [];
    //     return;
    //   }
    //   // rejected ? notify next provider
    //   if (status === 'rejected') {
    //     console.log('order rejected by this match... on to the next one...');
    //     await Provider.resetStatus(currentMatch.id);
    //     return notifyProviderLoop();
    //   }
    //   // currently set to unavailable ? next...
    //   if (status === 'unavailable') {
    //     console.log('matched but currently unavailable... skipping...');
    //     return notifyProviderLoop();
    //   }
    //   await new Promise((resolve) => setTimeout(resolve, 5000));
    //   // time out ? end loop
    // }
    // if (providerStack.length) return notifyProviderLoop();

    // // entire stack has been exhausted, no further matches.
    // // suggest searching with larger map radius
    // return console.log('no providers available');
    
  };

}

module.exports = ProviderFinder;
