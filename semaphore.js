const Semaphore = require('async-mutex').Semaphore

const photoSemaphore = new Semaphore(1)

module.exports = {
    photoSemaphore
}
