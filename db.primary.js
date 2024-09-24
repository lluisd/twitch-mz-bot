const mongoose = require("mongoose");
const config = require('./config')

module.exports = () => {
    // Connect to MongoDB
    mongoose.connect(config.database)
        .then()
        .catch(err => console.error("MongoDB primary connection failed, " + err));
}
