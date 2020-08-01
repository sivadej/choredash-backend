require('dotenv').config();

const SECRET = process.env.SECRET_KEY || 'tempsecret_changelater';

const PORT = +process.env.PORT || 3001;

let DB_URI;
let DB_NAME = 'choredash';

if (process.env.NODE_ENV === 'test') {
  DB_URI = 'choredash-test';
} else {
  DB_URI =
    process.env.DATABASE_URL || '';
}

console.log('Using database', DB_URI);

module.exports = {
  SECRET,
  PORT,
  DB_URI,
  DB_NAME,
};
