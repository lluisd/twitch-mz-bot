const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Immune Schema */
const ImmuneSchema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    slot: {
        type: Number,
        required: true
    },
    bans: {
        type: Number,
        required: true
    },
    expiryDate: {
        type: Date,
        required: true
    }
})

module.exports = mongoose.model('immune', ImmuneSchema, 'immunes')
