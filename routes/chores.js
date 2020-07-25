const express = require('express');
const router = express.Router();
const Chore = require('./../models/chore');

router.get('/', async (req,res,next)=>{
  console.log('get items ',req.query);
  try {
    const response = await Chore.getItems(req.query.search);
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

router.get('/:code', async (req,res,next)=>{
  console.log('get chore / code');
  try {
    const response = await Chore.getItemDetails(req.params.code);
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

module.exports = router;
