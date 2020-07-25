const db = require('../db');
const { DB_NAME } = require('./../config');

const COLL = 'orders';

class Order {
  // get all orders by userId (specify type)
  static async getAllById(userId, userType) {
    return {user: userId, type: userType};
  }

  // get order details
  static async getDetails(orderId) {
    return {details_for: orderId}
  }
  
  // update order status

}

module.exports = Order;
