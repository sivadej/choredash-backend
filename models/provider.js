const db = require('../db');
const bcrypt = require('bcrypt');
const MapsApi = require('./../mapsApi/mapsApi');
const { ObjectId } = require('mongodb');
const { DB_NAME } = require('./../config');
//const Order = require('./order');

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
  //              location: [lng, lag],
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
      location: [coords.lng, coords.lat],
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

  
  // update provider's availability
  static async updateAvailability(avail) {
    console.log('setting availability');
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne({ _id: new ObjectId(id) }, { $set: { available: avail } });
    //if (result.updatedCount === 1)
    return result;
    //else return { message: 'error' };
  }

  static async acceptOrder(id) {
    console.log('updating provider for order acceptance');
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'accepted', available: false } }
      );
    return result;
  }

  static async rejectOrder(id) {
    console.log('updating provider for order rejection');
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: 'rejected', current_order: null } }
      );
    return result;
  }

  static async setOrderStatus(id, orderId, status) {
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { status, current_order: orderId } }
      );
    if (result.modifiedCount === 1) {
      return result;
    } else return null;
  }

  static async resetStatus(id) {
    console.log('resetting status');
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne(
        { _id: new ObjectId(id) },
        { $set: { status: null, current_order: null } }
      );
    if (result.modifiedCount === 1) {
      return result;
    } else return null;
  }

  static async getStatus(id) {
    console.log('getting status');
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .findOne({ _id: new ObjectId(id), available: true });
    if (result === null) return null;
    return result;
  }

  // confirmCompletion(): set statuses of order on provider end
  static async confirmCompletion(orderId, providerId) {
    // if providerId not passed in, query order to retrieve providerId

    console.log('provider has confirmed order completion', orderId);
    console.log('updating PROVIDERS table');
    // set order status to 'customer_confirmed'
    const provUpdateResponse = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne(
        { _id: new ObjectId(providerId) },
        { $set: { status: 'confirmed_complete' } }
      );

    // check order table for completion status
    //const isCustomerConfirmed = await Order.isCustomerConfirmed(orderId);
    //if (isCustomerConfirmed) await Order.closeOrder(orderId);
    return;
  }

  // isConfirmedComplete() - boolean: is provider.current_order and status = 'confirmed_complete'
  static async isConfirmedComplete(orderId) {
    console.log('checking for provider confirmation...', orderId);
    const providerResult = await db
    .db(DB_NAME)
    .collection(COLL)
    .findOne(
      { current_order: orderId }
    );
    if (providerResult.status === 'confirmed_complete') return true;
    else return false;
  }

  static async getPendingOrder(providerId) {
    console.log('getting pending order for ',providerId);
    const res = await db
    .db(DB_NAME)
    .collection(COLL)
    .findOne(
      { _id: new ObjectId(providerId) }
    );
    let pendingOrder = {order_id:res.current_order, status:res.status, available:res.available};
    return pendingOrder;
  }

  static async resetAll() {
    console.log('resetting all provider status');
    const res = await db
    .db(DB_NAME)
    .collection(COLL)
    .updateMany(
      {},{$set:{available: true, status: null, current_order: null}}
    );
  }
}

module.exports = Provider;
