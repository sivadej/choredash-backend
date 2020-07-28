const express = require('express');
const router = express.Router();
const Order = require('./../models/order');
const { adminRequired, ensureCorrectUser } = require('./../middleware/auth');

// get all orders. requires admin access
router.get('/', adminRequired, async (req,res,next)=>{
  try {
    const response = await Order.getAll();
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

// get order by id number
// accessible only by customer or provider
router.get('/:orderId', ensureCorrectUser, async (req,res,next)=>{
  try {
    const response = await Order.getDetails(req.params.orderId);
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

// create new order from customer checkout
// returns newly created order
router.post('/', async (req,res,next)=>{
  try {
    const response = await Order.createNew(userId, orderData);
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

module.exports = router;