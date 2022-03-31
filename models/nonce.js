const mongoose = require('mongoose');

const nonce = new mongoose.Schema({
    address: {
        type: String,
        lowercase: true,
        index: true,
        unique: true
    },
    nonce: {
        type: String,
        required: true,
        index: true,
        unique: true
    },
    validTill: {
        type: Date,
        default: Date.now() + 2 * 60 * 1000 // 2 minutes
    }
});

module.exports = mongoose.model('NonceModel', nonce );
