const express = require('express');
const router = express.Router();
const Order = require('./../models/order');
const Provider = require('./../models/provider');
const Customer = require('./../models/customer');
const { adminRequired, ensureCorrectUser } = require('./../middleware/auth');

// get all orders. requires admin access
router.get('/', adminRequired, async (req, res, next) => {
  try {
    const response = await Order.getAll();
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// get order by id number
// accessible only by customer or provider
router.get('/:id', async (req, res, next) => {
  try {
    const response = await Order.getDetails(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// update order as provider accepted
// accessible only by provider
router.post('/:id/accept/:providerId', async (req, res, next) => {
  try {
    const [orderResponse, providerResponse] = await Promise.all([
      Order.accepted(req.params.id, req.params.providerId),
      Provider.acceptOrder(req.params.providerId),
    ]);
    return res.json({ orderResponse, providerResponse });
  } catch (err) {
    return next(err);
  }
});

// update order as provider rejected
// accessible only by provider
router.post('/:id/reject/:providerId', async (req, res, next) => {
  try {
    const [orderResponse, providerResponse] = await Promise.all([
      Order.rejected(req.params.id, req.params.providerId),
      Provider.rejectOrder(req.params.providerId),
    ]);
    return res.json({ orderResponse, providerResponse });
  } catch (err) {
    return next(err);
  }
});

// update order to reflect customer has confirmed completion
router.post('/:id/complete/customer', async (req, res, next) => {
  try {
    const response = await Customer.confirmCompletion(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// update order to reflect provider has confirmed completion
router.post('/:id/complete/provider', async (req, res, next) => {
  try {
    const response = await Provider.confirmCompletion(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// create new order from customer checkout
// returns newly created order
router.post('/', async (req, res, next) => {
  try {
    const response = await Order.createNew(userId, orderData);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// update order status
router.patch('/:id', async (req, res, next) => {
  try {
    const response = await Order.updateStatus(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});


// TODO: DEV ONLY - REMOVE THIS BEFORE DEPLOY
router.post('/:id/close-the-order-please', async (req, res, next) => {
  try {
    const response = await Order.closeOrder(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
