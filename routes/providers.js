const express = require('express');
const router = express.Router();
const Provider = require('./../models/provider');
const Order = require('./../models/order');

// GET / - get all providers
// restrict to admin use only
router.get('/', async (req, res, next) => {
  try {
    const response = await Provider.getAll();
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// GET /id - get provider by id
router.get('/:id', async (req, res, next) => {
  try {
    const response = await Provider.getById(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// POST: add new provider
router.post('/', async (req, res, next) => {
  try {
    const response = await Provider.addNew(req.body);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// PATCH /id - edit provider by id
router.patch('/:id', async (req, res, next) => {
  try {
    const response = await Provider.updateProfile(req.params.id, req.body);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// DELETE: remove provider
router.delete('/:id', async (req, res, next) => {
  try {
    const response = await Provider.delete(req.params.id);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

router.post('/auth', async (req, res, next) => {
  try {
    const response = await Provider.authenticate(req.body);
    return res.json(response);
  } catch (err) {
    return next(err);
  }
});

// GET /:id/orders
router.get('/:id/orders', async (req,res,next)=>{
  try {
    const response = await Order.getAllById(req.params.id, 'provider');
    return res.json(response);
  } catch (err) {
    return next(err);
  }
})

module.exports = router;
