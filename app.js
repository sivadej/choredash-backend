const express = require('express');
const app = express();
const cors = require('cors');
app.use(express.json());
app.use(cors());

const Customer = require('./models/customer');
const Provider = require('./models/provider');
const Chore = require('./models/chore');
const MapsApi = require('./mapsApi/mapsApi');

const customersRoutes = require('./routes/customers');
const choresRoutes = require('./routes/chores');
const providersRoutes = require('./routes/providers');

app.use('/api/customers', customersRoutes);
app.use('/api/chores', choresRoutes);
app.use('/api/providers', providersRoutes);


app.get('/coords', async (req,res,next)=>{
  const coords = await MapsApi.getCoordinates('1201 w 72nd ave');
  return res.status(200).json({result: coords});
})

// general error handlers

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
