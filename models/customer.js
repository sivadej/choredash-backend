const db = require('../db');
const bcrypt = require('bcrypt');
const MapsApi = require('./../mapsApi/mapsApi');
const { ObjectId } = require('mongodb');
const { DB_NAME } = require('./../config');

const COLL = 'customers';
const BCRYPT_WORK_FACTOR = 10;

class Customer {
  static async getAll() {
    console.log('Customer.getAll invoked');
    const result = await db.db(DB_NAME).collection(COLL).find().toArray();
    return result;
  }

  // addNew(data): Registers new user
  // Input body { email, first_name, last_name, password,
  //              address:{ line1, line2, city, state, zip },
  //              current_location: { lat, lng },
  //              orders: [] //array of orders by orderId
  //             }
  // call function getOne() using newly generated cust id -> return body?
  // Return: { message, customer:{} }
  static async addNew(customer) {
    // check for duplicate email address
    const duplicateCheck = await db
      .db(DB_NAME)
      .collection(COLL)
      .findOne({ email: customer.email });
    if (duplicateCheck !== null) return { message: 'email address in use' };

    // hash password before storing
    const hashedPassword = await bcrypt.hash(
      customer.password,
      BCRYPT_WORK_FACTOR
    );

    // get lat-lng coordinates
    let coords = await MapsApi.getCoordinates(customer.address);
    coords = coords.results[0].geometry.location;

    // add to database
    const custObj = {
      ...customer,
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

  // getById(id): Retrieve customer data by id
  // Return: { _id, email, first_name, last_name, address,
  //           current_location, orders }
  static async getById(id) {
    console.log('getting by id', id);
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .findOne({ _id: new ObjectId(id) });
    return result || { error: 'user not found' };
  }

  // updateProfile(data)
  //
  // Return: {}
  static async updateProfile(id, data) {
    console.log('updating user..', id, data);
    // TODO: check if valid user before performing update.
    // return confirmation of update
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne({ _id: new ObjectId(id) }, { $set: { ...data } });
    return result || { error: 'user not found' };
  }

  // updateOrders(id, data)
  // Return: {}

  // deleteCustomer(id, password)
  // Return: { message }
  static async delete(id) {
    console.log('deleting user', id);
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .deleteOne({ _id: new ObjectId(id) });
    if (result.deletedCount === 1)
      return { message: 'successfully deleted user' };
    else return { message: 'error' };
  }

  // getCart(userId)
  static async getCart(userId) {
    const user = await this.getById(userId);
    return user.cart;
  }

  // updateCart
  static async updateCart(userId, item, action) {
    // get and make copy of user's current cart
    const user = await this.getById(userId);
    let currentCart = [...user.cart];

    switch (action) {
      case 'ADD':
        currentCart.push(item);
        break;
      case 'REMOVE':
        currentCart = currentCart.filter((i) => i.itemcode !== item.itemcode);
        break;
      default:
        return { error: 'unrecognized cart action' };
    }

    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne(
        { _id: new ObjectId(userId) },
        { $set: { cart: currentCart } }
      );
    console.log(result)
    if (result.modifiedCount === 1) return { message: 'success' };
    else return { message: 'error. no changes made to cart.' };
  }
}

module.exports = Customer;
