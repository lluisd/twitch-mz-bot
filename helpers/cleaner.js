const crypto = require("crypto");
const moment = require('moment');

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

function buildHybridChunks(segments, startTime, maxChars = 450, maxGap = 1.5) {
    const chunks = [];
    let current = { text: "", start: null, end: null };

    for (let i = 0; i < segments.length; i++) {
        const seg = segments[i];

        if (current.start === null) current.start = seg.start;

        const nextSeg = segments[i + 1];
        const timeGap = nextSeg ? nextSeg.start - seg.end : 0;

        const wouldExceedChars = current.text.length + seg.text.length > maxChars;
        const longPause = timeGap > maxGap;

        // always append seg.text first
        current.text += (current.text ? " " : "") + seg.text;
        current.end = seg.end;

        // decide if we should close the chunk
        if (wouldExceedChars || longPause) {
            chunks.push({
                ...current,
                startTimeAbsolute: moment(startTime).add(current.start, 'seconds').toISOString()
            });
            // start new chunk
            current = { text: "", start: null, end: null };
        }
    }

    if (current.text) {
        chunks.push({
            ...current,
            startTimeAbsolute: moment(startTime).add(current.start, 'seconds').toISOString()
        });
    }

    return chunks;
}

function addOverlap(chunks, overlapPercent = 0.12) {
    return chunks.map((chunk, i) => {
        if (i === 0) return chunk; // el primero no tiene overlap

        const prev = chunks[i - 1];
        const overlapChars = Math.floor(prev.text.length * overlapPercent);
        const overlap = prev.text.slice(-overlapChars);

        return {
            ...chunk,
            text: overlap + " " + chunk.text
        };
    });
}

function joinConsecutiveMessagesByNickWithPause(messages, maxPauseSeconds = 60) {
    if (messages.length === 0) return [];

    const result = [];
    let current = {...messages[0]};

    for (let i = 1; i < messages.length; i++) {
        const msg = messages[i];

        // Calculate time difference in seconds
        const prevTime = new Date(current.date).getTime();
        const currTime = new Date(msg.date).getTime();
        const diffSeconds = (currTime - prevTime) / 1000;

        if (msg.nick === current.nick && diffSeconds <= maxPauseSeconds) {
            // Join messages only if same nick and small pause
            current.text += " " + msg.text;
            current.date = msg.date; // update to latest
        } else {
            // Push current and start new
            result.push(current);
            current = {...msg};
        }
    }
    result.push(current);

    return result;
}

module.exports = {
    removeConsecutiveDuplicates,
    removeRepeatedBlocks,
    buildHybridChunks,
    addOverlap,
    joinConsecutiveMessagesByNickWithPause
}