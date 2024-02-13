const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Channel Schema */
const BirthdaySchema = new Schema({
    nick: {
        type: String,
        required: true
    },
    day: {
        type: Number,
        required: true
    },
    month: {
        type: Number,
        required: true
    }
})

module.exports = mongoose.model('birthday', BirthdaySchema, 'birthdays')
