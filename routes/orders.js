const express = require('express');
const router = express.Router();
const Order = require('./../models/order');

// router.get('/', async (req,res,next)=>{
//   console.log('get items ',req.query);
//   try {
//     const response = await Order.getAllById(req.query.id, req.query.type);
//     return res.json(response);
//   }
//   catch (err) {
//     return next(err);
//   }
// });

router.get('/:orderId', async (req,res,next)=>{
  try {
    const response = await Order.getDetails(req.params.orderId);
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

module.exports = router;
