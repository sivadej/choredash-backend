const jwt = require('jsonwebtoken');
const { SECRET } = require('../config');

function authRequired(req, res, next) {
  try {
    const tokenStr = req.body._token || req.query._token;
    let token = jwt.verify(tokenStr, SECRET);
    req.username = token.username;
    return next();
  } catch (err) {
    let unauthorized = new Error('You must authenticate first.');
    unauthorized.status = 401; // 401 Unauthorized
    return next(unauthorized);
  }
}

function adminRequired(req, res, next) {
  try {
    const tokenStr = req.body._token;

    let token = jwt.verify(tokenStr, SECRET);
    req.username = token.username;

    if (token.is_admin) {
      return next();
    }

    throw new Error();
  } catch (err) {
    const unauthorized = new Error('You must be an admin to access.');
    unauthorized.status = 401;

    return next(unauthorized);
  }
}

function ensureCorrectUser(req, res, next) {
  try {
    const tokenStr = req.body._token || req.query._token;

    let token = jwt.verify(tokenStr, SECRET);
    req.username = token.username;

    if (token.username === req.params.username) {
      return next();
    }

    throw new Error();
  } catch (e) {
    const unauthorized = new Error('You are not authorized.');
    unauthorized.status = 401;

    return next(unauthorized);
  }
}

module.exports = {
  authRequired,
  adminRequired,
  ensureCorrectUser,
};
