const express = require('express');
const router = express.Router();
const Chore = require('./../models/chore');

router.get('/', async (req,res,next)=>{
  console.log('get customers using Class method');
  try {
    const response = await Chore.getAll();
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
