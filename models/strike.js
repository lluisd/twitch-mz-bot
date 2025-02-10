const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Strikes Schema */
const StrikesSchema = new Schema({
    userId: {
        type: Number,
        required: true
    },
    number: {
        type: Number,
        required: true
    },
    total: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('strike', StrikesSchema, 'strikes')
