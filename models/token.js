const mongoose = require('mongoose')
const Schema = mongoose.Schema

/* Token Schema */
const TokenSchema = new Schema({
    // Twitch user id
    userId: {
        type: Number,
        required: true
    },
    // The access token which is necessary for every request to the Twitch API.
    accessToken: {
        type: String,
        required: true
    },
    // The time, in seconds from the obtainment date, when the access token expires.
    expiresIn: {
        type: Number,
        required: false
    },
    // The date when the token was obtained, in epoch milliseconds.
    obtainmentTimestamp: {
        type: Number,
        required: true
    },
    // The refresh token which is necessary to refresh the access token once it expires.
    refreshToken: {
        type: String,
        required: false
    },
    // The scope the access token is valid for, i.e. what the token enables you to do.
    scope: [{
        type: String,
    }]
})

module.exports = mongoose.model('token', TokenSchema, 'tokens')