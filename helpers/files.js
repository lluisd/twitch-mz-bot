const fs = require('fs')
const path = require('path')

function groupFilesByMonth(inputDir, prefix) {
    const files = fs.readdirSync(inputDir)
    const grouped = {}

    files.forEach(file => {
        const match = file.match(new RegExp(`^${prefix}_(\\d{4}-\\d{2})-\\d{2}\\.json$`))
        if (match) {
            const ym = match[1]
            if (!grouped[ym]) grouped[ym] = []
            grouped[ym].push(file)
        }
    });

    return grouped;
}

function readRecordsFromFiles(inputDir, fileList) {
    const all = []
    for (const file of fileList) {
        const fullPath = path.join(inputDir, file)
        try {
            const content = fs.readFileSync(fullPath, 'utf-8')
            const data = JSON.parse(content)
            if (Array.isArray(data)) all.push(...data)
        } catch (err) {
            console.error(`Failed to parse ${file}:`, err.message)
        }
    }
    return all
}

function writeChunks(outputDir, prefix, ym, chunks) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    if (chunks.length === 1) {
        const outputFilename = path.join(outputDir, `${prefix}_${ym}.json`)
        fs.writeFileSync(outputFilename, JSON.stringify(chunks[0], null, 2))
        console.log(`Created ${outputFilename} (${chunks[0].length} items)`)
    } else {
        chunks.forEach((chunk, idx) => {
            const outputFilename = path.join(outputDir, `${prefix}_${ym}_${idx + 1}.json`)
            fs.writeFileSync(outputFilename, JSON.stringify(chunk, null, 2))
            console.log(`Created ${outputFilename} (${chunk.length} items)`)
        });
    }
}

module.exports = { groupFilesByMonth, readRecordsFromFiles, writeChunks }
