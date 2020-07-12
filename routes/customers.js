const express = require('express');
const router = express.Router();
const Customer = require('./../models/customer');


// GET / - get all customers
// restrict to admin use only
router.get('/', async (req,res,next)=>{
  const response = await Customer.getAll();
  return res.json(response);
});

// GET /id - get customer by id
router.get('/:id', async (req,res,next)=> {
  const response = await Customer.getById(req.params.id);
  return res.json(response);
});

// PATCH /id - edit customer by id
router.patch('/:id', async (req,res,next)=> {
  const response = await Customer.updateProfile(req.params.id, req.body);
  return res.json(response);
});

// POST: add new customer
router.post('/', async (req,res,next)=> {
  const response = await Customer.addNew(req.body);
  return res.json(response);
});



router.post('/auth', async (req,res,next) => {
  const response = await Customer.authenticate(req.body);
  return res.json(response);
});

module.exports = router;
