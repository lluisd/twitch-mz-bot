const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Vip Schema */
const VipSchema = new Schema({
    roomId: {
        type: Number,
        required: true
    },
    userId: {
        type: Number,
        required: true
    },
    userName: {
        type: String,
        required: true
    },
    expiryDate: {
        type: Date,
        required: false
    }
})

module.exports = mongoose.model('vip', VipSchema, 'vips')
