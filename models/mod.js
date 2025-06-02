const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Mod Schema */
const ModSchema = new Schema({
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

module.exports = mongoose.model('mod', ModSchema, 'mods')
