const db = require('../db');
const { DB_NAME } = require('./../config');
const { ObjectId } = require('mongodb');
const Customer = require('./../models/customer');
const ProviderFinder = require('./../helpers/ProviderFinder');

const COLL = 'orders';

class Order {
  // get all order data
  static async getAll() {
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .find()
      .toArray();
    return result;
  }

  // get all orders by userId (specify type)
  static async getAllById(userId, userType) {
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .find({[`${userType}_id`]: userId})
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

  // create new order
  static async createNew(custId, cartData) {
    console.log('creating order for', custId)
    const customer = await Customer.getById(custId);
    console.log('with cart items:', cartData.length)

    //create doc with cart items and customer_id
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .insertOne({
        customer_id: custId,
        customer_address: customer.address,
        customer_location: customer.current_location,
        items: cartData,
        date_created: new Date(Date.now()),
        provider_id: null,
        order_total: 0,
        est_travel_time: null,
        status: 'searching',
      });
    
    if (result.insertedCount === 1) {
      console.log('order inserted!', result.insertedId);
      this.assignProviders(result.insertedId, customer.current_location);
      return result.ops[0];
    }
    return;
  }

  // update order status
  static async updateStatus(orderId) {
    console.log('updating order status')
    return 'updating order status...';
  }

  static async assignProviders(orderId, custLoc) {
    console.log('assigning providers for order', orderId);
    console.log('for customer located at', custLoc);
    const providerFinder = new ProviderFinder(orderId, custLoc);
    const matches = await providerFinder.getMatches();
    console.log('found nearby matches!', matches);
  }
}

module.exports = Order;
