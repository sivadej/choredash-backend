const jwt = require('jsonwebtoken');
const { SECRET } = require('../config');

// authorizes request from any VALID token
function authRequired(req, res, next) {
  try {
    const token = req.body._token || req.query._token;
    jwt.verify(token, SECRET);
    return next();
  } catch (err) {
    let unauthorized = new Error('You must authenticate first.');
    unauthorized.status = 401; // 401 Unauthorized
    return next(unauthorized);
  }
}

// authorizes request where decoded token user type is 'admin'
function adminRequired(req, res, next) {
  try {
    const token = req.body._token;
    let decoded = jwt.verify(token, SECRET);
    if (decoded.is_admin === true) return next();
    else throw new Error();
  } catch (err) {
    const unauthorized = new Error('Unauthorized user. Admin required.');
    unauthorized.status = 401;
    return next(unauthorized);
  }
}

// authorizes request where decoded token id === params id
function ensureCorrectUser(req, res, next) {
  try {
    const token = req.body._token || req.query._token;
    let decoded = jwt.verify(token, SECRET);
    if (req.params.id === decoded.id) return next();
    else throw new Error();
  } catch (e) {
    const unauthorized = new Error('Unauthorized user.');
    unauthorized.status = 401;
    return next(unauthorized);
  }
}

module.exports = {
  authRequired,
  adminRequired,
  ensureCorrectUser,
};
