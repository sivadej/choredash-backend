const db = require('../db');

const COLLECTION_NAME = 'providers';

class Provider {
  static async getAll() {
    console.log('Provider.getAll invoked');
    const result = await db
      .collection(COLLECTION_NAME)
      .find()
      .toArray();
    return result;
  }

  static async findByKeyValue(key, value) {
    console.log('Provider.findbykv invoked');
    const result = await db
      .collection(COLLECTION_NAME)
      .findOne({ [key]: value }, { fields: { _id: 0 } });
    return result;
  }


  // update provider's current location
  static async updateLocation() {}

  // update provider's availability
  static async updateAvailability() {}

}

module.exports = Provider;
