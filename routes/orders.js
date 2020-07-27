const express = require('express');
const router = express.Router();
const Order = require('./../models/order');
const { adminRequired, ensureCorrectUser } = require('./../middleware/auth');

router.get('/', adminRequired, async (req,res,next)=>{
  try {
    const response = await Order.getAll();
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

router.get('/:orderId', ensureCorrectUser, async (req,res,next)=>{
  try {
    const response = await Order.getDetails(req.params.orderId);
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

module.exports = router;
