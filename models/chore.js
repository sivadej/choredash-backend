const db = require('../db');
const { DB_NAME } = require('./../config');

const COLL = 'chores';

class Chore {
  static async getItems(search) {
    console.log('chore.getItems invoked', search);
    let rgx = new RegExp(search, 'i');
    const searchQuery = !search ? {} : { item: { $regex: rgx } };
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .find(searchQuery)
      .toArray();
    return result;
  }

  // retrieve details by item_code
  static async getItemDetails(itemCode) {
    console.log('chore.getItemDetails invoked. itemCode:', itemCode);
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .findOne({ item_code: itemCode });
    return result;
  }

  // TODO
  // admin only: edit item, delete item
}

module.exports = Chore;
