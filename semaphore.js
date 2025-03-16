// semaphore.js
import { Semaphore } from 'async-mutex'

const photoSemaphore = new Semaphore(1)

export default photoSemaphore