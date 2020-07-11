const db = require('../db');

const COLLECTION_NAME = 'chores';

class Chore {

  static async getAll() {
    console.log('chore.getAll invoked');
    const result = await db.collection(COLLECTION_NAME).find().toArray();
    return result;
  }

  // retrieve details by item_code
  static async getItemDetails(itemCode) {
    console.log('chore.getItemDetails invoked. itemCode:',itemCode);
    const result = await db.collection(COLLECTION_NAME).findOne({item_code:itemCode});
    return result;
  }

  static async findByKeyValue(key, value) {
    console.log('chore.findbykv invoked');
    const result = await db.collection(COLLECTION_NAME).findOne({[key]:value});
    return result;
  }

}

module.exports = Chore;
