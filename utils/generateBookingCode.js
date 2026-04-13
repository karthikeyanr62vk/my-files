const crypto = require('crypto');

const generateBookingCode = () => crypto.randomBytes(4).toString('hex').toUpperCase();

module.exports = generateBookingCode;


