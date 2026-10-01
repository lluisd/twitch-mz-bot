const crypto = require('crypto')

const KICK_PUBLIC_KEY_URL = 'https://api.kick.com/public/v1/public-key'
let cachedPublicKey
let publicKeyFetch

async function fetchKickPublicKey() {
    const response = await fetch(KICK_PUBLIC_KEY_URL)
    if (!response.ok) {
        throw new Error(`Kick public key request failed: ${response.status}`)
    }

    const payload = await response.json()
    const publicKey = payload?.data?.public_key
    if (typeof publicKey !== 'string') {
        throw new Error('Kick public key response did not include a public key')
    }

    const parsedKey = crypto.createPublicKey(publicKey)
    if (parsedKey.asymmetricKeyType !== 'rsa') {
        throw new Error('Kick public key is not an RSA key')
    }

    return publicKey
}

async function getKickPublicKey(refresh = false) {
    if (cachedPublicKey && !refresh) {
        return cachedPublicKey
    }

    if (!publicKeyFetch) {
        publicKeyFetch = fetchKickPublicKey()
            .then(publicKey => {
                cachedPublicKey = publicKey
                return publicKey
            })
            .finally(() => {
                publicKeyFetch = undefined
            })
    }

    return publicKeyFetch
}

function signatureMatches(message, signature, publicKey) {
    try {
        const verify = crypto.createVerify('SHA256')
        verify.update(message)
        return verify.verify(publicKey, signature, 'base64')
    } catch {
        return false
    }
}

async function verifyKickSignature(messageId, timestamp, rawBody, signature) {
    if ([messageId, timestamp, rawBody, signature].some(value => typeof value !== 'string')) {
        return false
    }

    const message = `${messageId}.${timestamp}.${rawBody}`
    const publicKey = await getKickPublicKey()
    if (signatureMatches(message, signature, publicKey)) {
        return true
    }

    const refreshedPublicKey = await getKickPublicKey(true)
    return signatureMatches(message, signature, refreshedPublicKey)
}

module.exports = { verifyKickSignature }
