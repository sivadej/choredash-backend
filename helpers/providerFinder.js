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
const Order = require('./../models/Order');
const Provider = require('./../models/Provider');
const { setStatus } = require('./../models/Provider');

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
      console.log(`found ${result.length} nearby providers:`);
      this.providerLocs = result.map((p) => [p.location[1], p.location[0]]); //[lat,lng] array for googlemaps api
      result.forEach((p) => {
        this.providerStack.push({
          id: p._id,
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
      [this.customerLoc],
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
    return (this.providerStack).sort((a,b)=>b.duration_value - a.duration_value);
  };

  notifyProviderLoop = async () => {
    console.log('notifying providers...')
  
    // set the current match by popping from the stack
    this.currentMatch = this.providerStack.pop();

    // call function to assign status to current providerId
    await Provider.setPendingOrder(this.currentMatch.id, JSON.stringify(this.orderId), 'waiting');
    
    // perform status check every 5 seconds for 1 minute
    for (let i=0; i<12; i++) {
      await new Promise(resolve => setTimeout(resolve, 5000));
      let status = await Provider.getStatus(this.currentMatch.id, this.orderId);
      // accepted ? move on to active status
      if (status === 'accepted') {
        console.log('yay! matched provider has accepted!')
        //todo: perform db operations to clean up provider status
        break;
      }
      // rejected ? notify next provider
      if (status === 'rejected') {
        console.log('matched provider has rejected the order... on to the next one...')
        //todo: perform db operations to clean up provider status
        return this.notifyProviderLoop();
      }
      // time out ? end loop
    }
    //todo: perform db operations to clean up provider status
    if (this.providerStack.length) return this.notifyProviderLoop();

    // entire stack has been exhausted, no further matches.
    // suggest searching with larger map radius
    return console.log('no providers available');
  }

}

module.exports = ProviderFinder;
