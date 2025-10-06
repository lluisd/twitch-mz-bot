const {removeConsecutiveDuplicates, removeRepeatedBlocks} = require("./cleaner")

async function mergeAndClean(records, maxSize = 5 * 1024 * 1024) {
    const sorted = records.sort((a, b) => new Date(a.date) - new Date(b.date))

    let cleaned = removeConsecutiveDuplicates(sorted)
    cleaned = removeRepeatedBlocks(cleaned)

    const outputs = []
    let chunk = []
    let currentSize = 2

    for (const item of cleaned) {
        const itemStr = JSON.stringify(item, null, 2)
        const itemSize = Buffer.byteLength(itemStr, 'utf8') + 2

        if (currentSize + itemSize > maxSize && chunk.length > 0) {
            outputs.push(chunk)
            chunk = []
            currentSize = 2
        }
        chunk.push(item)
        currentSize += itemSize
    }
    if (chunk.length > 0) outputs.push(chunk)

    return outputs
}

module.exports = { mergeAndClean }