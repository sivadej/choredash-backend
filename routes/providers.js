const express = require('express');
const router = express.Router();
const Provider = require('./../models/provider');

router.get('/hello', (req,res,next)=> {
  return res.json({status:'hello from provider routes'});
});

router.get('/', async (req,res,next)=>{
  const response = await Provider.getAll();
  return res.json(response);
});

module.exports = router;
