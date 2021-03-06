const db = require('../db');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const MapsApi = require('./../mapsApi/mapsApi');
const { ObjectId } = require('mongodb');
const { DB_NAME, SECRET } = require('./../config');

const COLL = 'customers';
const BCRYPT_WORK_FACTOR = 10;

// get a signed JWT from user data
function createToken(user) {
  let payload = {
    id: user._id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    type: user.type,
  };
  return jwt.sign(payload, SECRET);
}

class Customer {
  static async getAll() {
    console.log('Customer.getAll invoked');
    const result = await db.db(DB_NAME).collection(COLL).find().toArray();
    return result;
  }

  // addNew(data): Registers new user
  // Input body { email, first_name, last_name, password,
  //              address:{ line1, line2, city, state, zip },
  //              location: [lng, lat],
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
      location: [coords.lng, coords.lat],
      cart: [],
    };
    await db.db(DB_NAME).collection(COLL).insertOne(custObj);

    const loginCust = await Customer.authenticate({email:customer.email, password:customer.password});
    if (loginCust.authenticated) {
      const token = createToken({ ...loginCust.user, type: 'customer' });
      return ({_token:token});
    }
    else return {message: loginCust.message}
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
        delete user.password;
        return { authenticated: true, user: user };
      }
    }

    return { authenticated: false, message: 'invalid credentials' };
  }

  // getById(id): Retrieve customer data by id
  // Return: { _id, email, first_name, last_name, address,
  //           location[lng,lat], orders }
  static async getById(id) {
    console.log('getting by id', id);
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .findOne({ _id: new ObjectId(id) });
    return result || { error: 'user not found' };
  }

  // updateProfile(data)
  // Return: {}
  static async updateProfile(id, data) {
    console.log('updating user profile..', id);
    
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne({ _id: new ObjectId(id) }, { $set: { ...data } });

    if (result.result.ok) {
      return data;
    } else return { error: 'user not found' };
  }


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

  static async clearCart(userId) {
    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne({ _id: new ObjectId(userId) }, { $set: { cart: [] } });

    if (result.result.ok) {
      return;
    } else return { message: 'error' };
  }

  // updateCart
  static async updateCart(userId, item, action) {
    // get and make copy of user's current cart
    const currentCart = await this.getCart(userId);
    let newCart = [];

    switch (action) {
      case 'ADD':
        newCart = [...currentCart, item];
        break;
      case 'REMOVE':
        newCart = currentCart.filter((i) => i.item_code !== item.item_code);
        break;
      default:
        return { error: 'unrecognized cart action' };
    }

    const result = await db
      .db(DB_NAME)
      .collection(COLL)
      .updateOne({ _id: new ObjectId(userId) }, { $set: { cart: newCart } });

    if (result.modifiedCount === 1) return newCart;
    else return { message: 'error. no changes made to cart.' };
  }

}

module.exports = Customer;