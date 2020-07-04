const express = require('express');
const router = express.Router();
const Customer = require('./../models/customer');

router.get('/test', (req,res,next)=> {
  return res.json({status:'success'});
});

router.get('/', async (req,res,next)=>{
  console.log('get customers using Class method');
  const response = await Customer.getAll();
  return res.json(response);
});

router.get('/1', async (req,res,next)=>{
  console.log('get test customer');
  const response = await Customer.findByKeyValue('address','8709 Little Brook Cir, Anchorage, AK 99507');
  return res.json(response);
});

module.exports = router;
