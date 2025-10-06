const Semaphore = require('async-mutex').Semaphore

const photoSemaphore = new Semaphore(1)
const transcribeSemaphore = new Semaphore(1)
const mergeTranscriptionsSemaphore = new Semaphore(1)

module.exports = {
    photoSemaphore,
    transcribeSemaphore,
    mergeTranscriptionsSemaphore
}
