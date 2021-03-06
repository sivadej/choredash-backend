const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const Customer = require('./../models/customer');
const Provider = require('./../models/provider');
const { SECRET } = require('./../config');

const { validate } = require('jsonschema');
const authSchema_login = require('./../schemas/authSchema_login');

// get a signed JWT from user data
function createToken(user) {
  let payload = {
    id: user._id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email,
    type: user.type,
  };
  return jwt.sign(payload, SECRET);
}

// authenticate email/password and get customer data
// return signed token
router.post('/customer/login', async (req, res, next) => {
  console.log('invoked customer login');
  try {
    const validation = validate(req.body, authSchema_login);
    if (!validation.valid) {
      return next({
        status: 400,
        error: validation.errors.map((e) => e.stack),
      });
    }
    const customer = await Customer.authenticate(req.body);
    console.log(customer.user);
    if (customer.authenticated) {
      const token = createToken({ ...customer.user, type: 'customer' });
      return res.json({ _token: token });
    } else return res.json({ message: customer.message });
  } catch (err) {
    return next(err);
  }
});

// authenticate email/password and get provider data
// return signed token
router.post('/provider/login', async (req, res, next) => {
  console.log('invoked provider login');
  const validation = validate(req.body, authSchema_login);
  if (!validation.valid) {
    return next({
      status: 400,
      error: validation.errors.map((e) => e.stack),
    });
  }
  try {
    const provider = await Provider.authenticate(req.body);
    if (provider.authenticated) {
      const token = createToken({ ...provider.user, type: 'provider' });
      return res.json({ _token: token });
    } else return res.json({ message: provider.message });
  } catch (err) {
    return next(err);
  }
});

// get user info from login token
router.post('/verify', async (req, res, next) => {
  try {
    console.log('verify jwt invoked');
    const tokenStr = req.body._token || req.query._token;
    console.log('received login token', tokenStr);
    let decodedToken = jwt.verify(tokenStr, SECRET);
    console.log('jwt token data', decodedToken);
    return res.json(decodedToken);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
