const express = require('express');
const router = express.Router();
const Customer = require('./../models/customer');

router.get('/hello', (req,res,next)=> {
  return res.json({status:'hello from customer routes'});
});

router.get('/', async (req,res,next)=>{
  const response = await Customer.getAll();
  return res.json(response);
});

// router.get('/1', async (req,res,next)=>{
//   console.log('get test customer');
//   const response = await Customer.findByKeyValue('address','8709 Little Brook Cir, Anchorage, AK 99507');
//   return res.json(response);
// });

module.exports = router;
