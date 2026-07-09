const crypto = require('crypto');
const generateShareToken = () => crypto.randomBytes(24).toString('hex');
module.exports = { generateShareToken };