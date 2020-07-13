const express = require('express');
const router = express.Router();
const Customer = require('./../models/customer');

// GET / - get all customers
// restrict to admin use only
router.get('/', async (req, res, next) => {
  try {
    const response = await Customer.getAll();
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// GET /id - get customer by id
// restrict to admin/currentid use only
router.get('/:id', async (req, res, next) => {
  try {
    const response = await Customer.getById(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// PATCH /id - edit customer by id
// restrict to admin/currentid use only
router.patch('/:id', async (req, res, next) => {
  try {
    const response = await Customer.updateProfile(req.params.id, req.body);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// POST: add new customer
router.post('/', async (req, res, next) => {
  try {
    const response = await Customer.addNew(req.body);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// DELETE: remove customer
// restrict to admin/currentid use only
router.delete('/:id', async (req, res, next) => {
  try {
    const response = await Customer.delete(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// POST /auth - authenticate user
// params: object { email, password }
router.post('/auth', async (req, res, next) => {
  try {
    const response = await Customer.authenticate(req.body);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
