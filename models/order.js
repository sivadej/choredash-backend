const db = require('../db');
const { DB_NAME } = require('./../config');
const { ObjectId } = require('mongodb');
const Customer = require('./../models/customer');
const ProviderFinder = require('./../helpers/ProviderFinder');

const COLL = 'orders';

class Order {
  // get all order data
  static async getAll() {
    const result = await db.db(DB_NAME).collection(COLL).find().toArray();
    return result;
  }

  // get all orders by userId (specify type)
  static async getAllById(userId, userType) {
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .find({ [`${userType}_id`]: userId })
      .toArray();
    return result;
  }

  // get order details
  static async getDetails(orderId) {
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .findOne({ _id: new ObjectId(orderId) });
    return result;
  }

  // update order status
  static async updateStatus(orderId, key, data) {
    console.log('updating order status');
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne({ _id: new ObjectId(orderId) }, { $set: { [key]: data } });
    return result;
  }

  // create new order
  // immediately begin search for provider match
  static async createNew(custId, cartData) {
    console.log('creating order for', custId);
    const customer = await Customer.getById(custId);
    console.log('with cart items:', cartData.length);

    // create db order with cart items and customer_id
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .insertOne({
        customer_id: custId,
        customer_address: customer.address,
        customer_location: customer.location,
        items: cartData,
        date_created: new Date(Date.now()),
        provider_id: null,
        order_total: 0,
        est_travel_time: null,
        status: 'searching',
      });

    // confirm successful db operation, then look for providers
    if (result.insertedCount === 1) {
      console.log('order inserted!', result.insertedId);
      await this.assignProviders(result.insertedId, customer.location);
      return result.ops[0];
    }
    return;
  }

  // call ProviderFinder class to perform distance calculations.
  // store sorted array (provider stack) into database
  static async assignProviders(orderId, custLoc) {
    console.log('finding nearby providers for order:', orderId);

    const providerFinder = new ProviderFinder(orderId, custLoc);
    const matches = await providerFinder.getMatches();

    const updateResult = await this.updateStatus(
      orderId,
      'provider_matches',
      matches
    );
    if (updateResult.modifiedCount !== 1) return 'error';

    const assignedProvider = providerFinder.notifyProviderLoop();
    return assignedProvider;
  }

  static async setStatus() {
    return 'set status';
  }

  static async accepted(orderId, providerId) {
    console.log('updating order as accepted');
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne(
        { _id: new ObjectId(orderId) },
        {
          $set: {
            status: 'accepted',
            provider_id: providerId,
            provider_matches: [],
          },
        }
      );
    return result;
  }

  static async rejected(orderId) {
    console.log('updating order as rejected');
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne(
        { _id: new ObjectId(orderId) },
        { $set: { status: 'searching', provider_id: null } }
      );
    return result;
  }

  static async isCustomerConfirmed(orderId) {
    console.log('checking if customer has confirmed completion:', orderId);
    return;
  }

  // closeOrder(): finalize order, reset provider status
  static async closeOrder(orderId) {
    console.log('closing order', orderId);

    // in db: set order.status to 'completed'
    const orderUpdateResult = await db
      .db(DB_NAME)
      .collection(COLL)
      .findOneAndUpdate(
        { _id: new ObjectId(orderId) },
        { $set: { status: 'completed' } }
      );
    console.log(orderUpdateResult);
    console.log('getting provider id', orderUpdateResult.value.provider_id)
    
    // retrieve providerId from order update query
    // set provider availability to true
    // set provider current order to null
    const providerId = orderUpdateResult.value.provider_id;
    
    const provUpdateResult = await db
      .db(DB_NAME)
      .collection('providers')
      .findOneAndUpdate(
        { _id: new ObjectId(providerId) },
        { $set: { status: null, available: true, current_order: null } }
      );

    return provUpdateResult;
    
  }
}

module.exports = Order;
