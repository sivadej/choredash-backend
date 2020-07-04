const db = require('../db');
const bcrypt = require('bcrypt');

const COLLECTION_NAME = 'chores';

class Chore {

  static async getAll() {
    console.log('chore.getAll invoked');
    const result = await db.collection(COLLECTION_NAME).find({},{item:1}).toArray();
    return result;
  }

  // retrieve details by id
  static async getItemDetails(id) {
    console.log('chore.getItemDetails invoked. id:',id);
    const result = await db.collection(COLLECTION_NAME).findOne({id:id});
    return result;
  }

  static async findByKeyValue(key, value) {
    console.log('chore.findbykv invoked');
    const result = await db.collection(COLLECTION_NAME).findOne({[key]:value});
    return result;
  }

  // todo methods

  // update provider's current location
  static async updateLocation() {};

  // update provider's availability
  static async updateAvailability() {};

  // return all chores ordered by order number
  static async getItemsInOrder(orderId) {};

}

module.exports = Chore;
