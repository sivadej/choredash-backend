const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Customer = require('./../models/customer');
const Provider = require('./../models/provider');
const { SECRET } = require('./../config');

// get a signed JWT from user data
function createToken(user) {
  let payload = {
    customer: 'yes',
    test: 'testah',
  };
  return jwt.sign(payload, SECRET);
}

// authenticate email/password and get customer data
// return signed token
router.post('/customer/login', async (req, res, next) => {
  console.log('invoked customer login', req.body);
  const customer = await Customer.authenticate(req.body);
  const token = createToken(customer);
  return res.json(token);
});

// authenticate email/password and get provider data
// return signed token
router.post('/provider/login', async (req, res, next) => {
  console.log('invoked provider login', req.body);
  const provider = await Provider.authenticate(req.body);
  const token = createToken(provider);
  return res.json(token);
});

router.post('/customer/verify', async (req, res, next) => {
  try {
    console.log('customer verify jwt invoked');
    const tokenStr = req.body._token || req.query._token;
    console.log('received login token', tokenStr);
    let token = jwt.verify(tokenStr, SECRET);
    console.log('jwt token data', token);
    return res.json(token);
  } catch (err) {
    return next(err);
  }
});



module.exports = router;
