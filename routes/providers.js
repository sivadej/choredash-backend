const express = require('express');
const router = express.Router();
const Provider = require('./../models/provider');

// GET / - get all providers
// restrict to admin use only
router.get('/', async (req, res, next) => {
  const response = await Provider.getAll();
  return res.json(response);
});

// GET /id - get provider by id
router.get('/:id', async (req, res, next) => {
  const response = await Provider.getById(req.params.id);
  return res.json(response);
});

// POST: add new provider
router.post('/', async (req, res, next) => {
  const response = await Provider.addNew(req.body);
  return res.json(response);
});

// PATCH /id - edit provider by id
router.patch('/:id', async (req, res, next) => {
  const response = await Provider.updateProfile(req.params.id, req.body);
  return res.json(response);
});

// DELETE: remove provider
router.delete('/:id', async (req, res, next) => {
  const response = await Provider.delete(req.params.id);
  return res.json(response);
});

router.post('/auth', async (req, res, next) => {
  const response = await Provider.authenticate(req.body);
  return res.json(response);
});

module.exports = router;
