const db = require('../db');
const bcrypt = require('bcrypt');
const MapsApi = require('./../mapsApi/mapsApi');
const { ObjectId } = require('mongodb');
const { DB_NAME } = require('./../config');

const COLL = 'providers';
const BCRYPT_WORK_FACTOR = 10;

class Provider {
  static async getAll() {
    console.log('Provider.getAll invoked');
    const result = await db.db(DB_NAME).collection(COLL).find().toArray();
    return result;
  }

  // getById(id): Retrieve provider data by id
  static async getById(id) {
    console.log('getting provider by id', id);
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .findOne({ _id: new ObjectId(id) });
    return result || { error: 'provider not found' };
  }

  // addNew(data): Registers new provider
  // Input body { email, first_name, last_name, password,
  //              address:{ line1, line2, city, state, zip },
  //              current_location: { lat, lng },
  //              orders: [] //array of orders by orderId
  //             }
  // call function getOne() using newly generated cust id -> return body?
  // Return: { message, provider:{} }
  static async addNew(provider) {
    // check for duplicate email address
    const duplicateCheck = await db
      .db(DB_NAME)
      .collection(COLL)
      .findOne({ email: provider.email });
    if (duplicateCheck !== null) return { message: 'email address in use' };

    // hash password before storing
    const hashedPassword = await bcrypt.hash(
      provider.password,
      BCRYPT_WORK_FACTOR
    );

    // get lat-lng coordinates
    let coords = await MapsApi.getCoordinates(provider.address);
    coords = coords.results[0].geometry.location;

    // add to database
    const custObj = {
      ...provider,
      password: hashedPassword,
      current_location: coords,
      orders: [],
    };
    const result = await db.db(DB_NAME).collection(COLL).insertOne(custObj);

    return result.ops[0];
  }

  // authenticate(data): return user on valid authentication
  // params: object { email, password }
  static async authenticate({ email, password }) {
    // find user
    console.log('finding user for email', email);
    const user = await db
      .db(DB_NAME)
      .collection(COLL)
      .findOne({ email: email });

    if (user) {
      const isValid = await bcrypt.compare(password, user.password);
      if (isValid) {
        delete user.password; //do not return password in response
        return { authenticated: true, user: user };
      }
    }

    return { authenticated: false, message: 'invalid credentials' };
  }

  // delete(id)
  // Return: { message }
  static async delete(id) {
    console.log('deleting provider', id);
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1)
      return { message: 'successfully deleted provider' };
    else return { message: 'error' };
  }

  // update provider's current location
  static async updateLocation() {}

  // update provider's availability
  static async updateAvailability() {}
}

module.exports = Provider;
