const db = require('../db');
const { DB_NAME } = require('./../config');
const { ObjectId } = require('mongodb');

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
    console.log('with cart items:', cartData.length)

    //create doc with cart items and customer_id
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .insertOne({
        customer_id: custId,
        items: cartData,
        date_created: new Date(Date.now()),
        provider_id: null,
        order_total: 0,
        est_travel_time: null,
        status: 'created',
      });
    
    if (result.insertedCount === 1) {
      console.log('order inserted!', result.insertedId);
      return result.ops[0];
    }
    return;
  }

  // update order status
}

module.exports = Order;
