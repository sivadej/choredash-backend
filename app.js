const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors());

const Customer = require('./models/customer');
const Provider = require('./models/provider');
const Chore = require('./models/chore');

const customersRoutes = require('./routes/customers');

app.use('/api/customers', customersRoutes);

app.get('/chores', async (req,res,next)=>{
  console.log('get chores');
  try {
    const response = await Chore.getAll();
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

app.get('/chores/:id', async (req,res,next)=>{
  console.log('get chores');
  try {
    const response = await Chore.getItemDetails(req.params.id);
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

app.get('/providers', async (req,res,next)=>{
  console.log('get providers');
  try {
    const response = await Provider.getAll();
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

app.get('/providers/1', async (req,res,next)=>{
  console.log('get provider 1');
  try {
    const response = await Provider.findByKeyValue('id',1);
    return res.json(response);
  }
  catch (err) {
    return next(err);
  }
});

app.use((req, res, next) => {
  const err = new Error('Not Found');
  err.status = 404;

  return next(err);
});

app.use((err, req, res, next) => {
  if (err.stack) console.log(err.stack);

  res.status(err.status || 500);

  return res.json({
    error: err,
    message: err.message,
  });
});

module.exports = app;
