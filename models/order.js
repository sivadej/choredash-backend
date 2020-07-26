const db = require('../db');
const { DB_NAME } = require('./../config');
const { ObjectId } = require('mongodb');

const COLL = 'orders';

class Order {
  // get all orders
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

  // update order status
}

module.exports = Order;
