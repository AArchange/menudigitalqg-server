// server/utils/generateToken.js
const jwt = require('jsonwebtoken');

const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: '30d', // Le jeton sera valide pendant 30 jours
  });
};

module.exports = generateToken;