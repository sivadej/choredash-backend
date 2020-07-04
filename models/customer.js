const db = require('../db');
const bcrypt = require('bcrypt');

class Customer {

  static async getAll() {
    console.log('Customer.getAll invoked');
    const result = await db.collection('customers').find().toArray();
    return result;
  }

  static async findByKeyValue(key, value) {
    console.log('findbykv invoked');
    const result = await db.collection('customers').findOne({[key]:value});
    return result;
  }

}

module.exports = Customer;
