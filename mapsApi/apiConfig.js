require('dotenv').config();

const MAPS_API_KEY =
  process.env.MAPS_API_KEY || 'YOUR GOOGLE MAPS API KEY';

module.exports = { MAPS_API_KEY };
