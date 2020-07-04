const MongoClient = require('mongodb').MongoClient;
const { DB_URI, DB_NAME } = require('./config');

const client = new MongoClient(DB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

client.connect();
console.log('connecting to db:', DB_NAME);

module.exports = client.db(DB_NAME);