const express = require('express');
const router = express.Router();
const Customer = require('./../models/customer');
const Order = require('./../models/order');
const { adminRequired, ensureCorrectUser } = require('./../middleware/auth');

const { validate } = require('jsonschema');
const customerSchema_new = require('./../schemas/customerSchema_new');
const customerSchema_edit = require('./../schemas/customerSchema_edit');

// GET / - get all customers
// restrict to admin use only
router.get('/', adminRequired, async (req, res, next) => {
  try {
    const response = await Customer.getAll();
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// GET /id - get customer by id
// restrict to admin/currentid use only
router.get('/:id', ensureCorrectUser, async (req, res, next) => {
  try {
    const response = await Customer.getById(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// PATCH /id - edit customer by id
// restrict to admin/currentid use only
router.patch('/:id', ensureCorrectUser, async (req, res, next) => {
  try {
    const response = await Customer.updateProfile(req.params.id, req.body);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// Input body { email, first_name, last_name, password,
//              address:{ line1, line2, city, state, zip },
//              location: [lng, lat],
//              orders: [] //array of orders by orderId
//             }

// POST: add new customer
router.post('/', async (req, res, next) => {
  try {
    const data = {
      email: req.body.email,
      first_name: req.body.first_name,
      last_name: req.body.last_name,
      password: req.body.password,
      address: {
        line1: req.body.address_line1,
        line2: req.body.address_line2,
        city: req.body.city,
        state: req.body.state.toUpperCase(),
        zip: req.body.zip,
      },
    };
    const validation = validate(data, customerSchema_new);
    if (!validation.valid) {
      return next({
        status: 400,
        error: validation.errors.map((e) => e.stack),
      });
    }
    const response = await Customer.addNew(data);
    return res.json({ ...response, ok: true });
  } catch (err) {
    return next(err);
  }
});

// DELETE: remove customer
// restrict to admin/currentid use only
router.delete('/:id', ensureCorrectUser, async (req, res, next) => {
  try {
    const response = await Customer.delete(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// POST /auth - authenticate user
// body params: object { email, password }
router.post('/auth', async (req, res, next) => {
  try {
    const validation = validate(req.body, customerSchema_edit);
    if (!validation.valid) {
      return next({
        status: 400,
        error: validation.errors.map((e) => e.stack),
      });
    }
    const response = await Customer.authenticate(req.body);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// GET /:id/cart
// restrict to admin/currentid use only
router.get('/:id/cart', ensureCorrectUser, async (req, res, next) => {
  try {
    const response = await Customer.getCart(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// PATCH /:id/cart - update cart
// restrict to admin/currentid use only
// body params: {cart: array[itemId, itemId...]}
router.patch('/:id/cart', ensureCorrectUser, async (req, res, next) => {
  try {
    const response = await Customer.updateCart(
      req.params.id,
      req.body.item,
      req.body.action
    );
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// POST /:id/cart/checkout - customer order checkout
//
router.post('/:id/cart/checkout', ensureCorrectUser, async (req, res, next) => {
  try {
    console.log('finalizing checkout for customer', req.params.id);

    // get cust cart, send to new order, return orderid details
    const cartResponse = await Customer.getCart(req.params.id);
    if (cartResponse.length > 0) {
      const orderResponse = await Order.createNew(req.params.id, cartResponse);

      // on order success, clear customer cart (don't delete cart if order creation fails!)
      // begin provider seach process
      if (orderResponse.status === 'searching') {
        await Customer.clearCart(req.params.id);
        return res.json({
          success: true,
          orderId: orderResponse._id,
          data: orderResponse,
        });
      }
    }

    return res.json({ message: 'checkout failed' });
  } catch (err) {
    return next(err);
  }
});

// GET /:id/orders
router.get('/:id/orders', ensureCorrectUser, async (req, res, next) => {
  try {
    const response = await Order.getAllById(req.params.id, 'customer');
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
