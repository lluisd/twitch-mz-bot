const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Ban Schema */
const BanSchema = new Schema({
    roomId: {
        type: Number,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    moderatorName: {
        type: String,
        required: false
    },
    reason: {
        type: String,
        required: false
    },
    creationDate: {
        type: Date,
        required: true
    },
    expiryDate: {
        type: Date,
        required: false
    }
})

module.exports = mongoose.model('ban', BanSchema, 'bans')
