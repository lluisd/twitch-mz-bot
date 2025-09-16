const crypto = require("crypto");

function removeConsecutiveDuplicates(messages) {
    let cleaned = []
    messages.forEach((current) => {
        const prev = cleaned[cleaned.length - 1]
        if (!(prev && prev.nick === current.nick && prev.text === current.text)) {
            cleaned.push(current)
        }
    })
    return cleaned
}

function hashBlock(block) {
    const str = block.map(m => `${m.nick}:${m.text}`).join('|');
    return crypto.createHash('md5').update(str).digest('hex');
}

function removeRepeatedBlocks(messages) {
    const MAX_BLOCK = 5
    let cleaned = [...messages]
    let i = 0

    while (i < cleaned.length) {
        let maxLen = Math.min(MAX_BLOCK, Math.floor((cleaned.length - i) / 2));
        let found = false

        for (let len = maxLen; len >= 1; len--) {
            const block1 = cleaned.slice(i, i + len)
            const block2 = cleaned.slice(i + len, i + 2 * len)

            if (hashBlock(block1) === hashBlock(block2)) {
                cleaned.splice(i + len, len)
                found = true
                break
            }
        }

        i += found ? 0 : 1
    }
    return cleaned
}

module.exports = {
    removeConsecutiveDuplicates,
    removeRepeatedBlocks
}