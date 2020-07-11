const db = require('../db');
const bcrypt = require('bcrypt');
const MapsApi = require('./../mapsApi/mapsApi');

const COLLECTION = 'customers';
const BCRYPT_WORK_FACTOR = 10;

class Customer {

  static async getAll() {
    console.log('Customer.getAll invoked');
    const result = await db.collection(COLLECTION).find().toArray();
    return result;
  }

  static async findByKeyValue(key, value) {
    console.log('findbykv invoked');
    const result = await db.collection(COLLECTION).findOne({ [key]: value });
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
      .collection(COLLECTION)
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
    const custObj = { ...customer, password: hashedPassword, current_location: coords, orders: [] };
    const result = await db.collection(COLLECTION).insertOne(custObj);

    return result.ops[0];
  }

  // getById(id): Retrieve customer data by id
  // Return: { _id, email, first_name, last_name, address,
  //           current_location, orders }

  // getByEmail(email): Retrieve customer data by email
  // Return: { _id, email, first_name, last_name, address,
  //           current_location, orders }

  // updateProfile(data)
  // Return: {}

  // updateLocation(data)
  // Return: {}

  // updateOrders(data)
  // Return: {}

  // deleteCustomer()
  // Return: { message }

}

module.exports = Customer;
