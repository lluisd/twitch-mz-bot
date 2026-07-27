const VOCAB_SIZE = 2 ** 18

function tokenize(text) {
    return text
        .toLowerCase()
        .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter(token => token.length > 1)
}

function hashToken(token) {
    let hash = 2166136261
    for (let i = 0; i < token.length; i++) {
        hash ^= token.charCodeAt(i)
        hash = Math.imul(hash, 16777619)
    }
    return Math.abs(hash) % VOCAB_SIZE
}

function buildSparseVector(text = '') {
    const counts = new Map()
    for (const token of tokenize(text)) {
        const idx = hashToken(token)
        counts.set(idx, (counts.get(idx) || 0) + 1)
    }

    return {
        indices: [...counts.keys()],
        values: [...counts.values()]
    }
}

module.exports = {
    buildSparseVector
}