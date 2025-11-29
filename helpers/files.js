const fs = require('fs')
const path = require('path')
const logger = require('../lib/logger')

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
            logger.error(`Failed to parse ${file}:`, err.message)
        }
    }
    return all
}

function getRecords(dir, pattern) {
    try {
        const files  = fs.readdirSync(dir)
        const matchedFiles = files .filter(file => pattern.test(file))
        const all = []

        for (const file of matchedFiles) {
            const filePath = path.join(dir, file)
            const content = fs.readFileSync(filePath, "utf8");
            const data = JSON.parse(content)
            if (Array.isArray(data)) all.push(...data)
        }
        return all
    } catch (err) {
        logger.error(`Error reading files from ${dir}:`, err.message)
    }
}

function deleteFile(dir, filename) {
    try {
        const filePath = path.join(dir, filename)

        if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath)
            logger.info(`Deleted file: ${filePath}`)
            return true
        } else {
            logger.warn(`File not found: ${filePath}`)
            return false
        }
    } catch (err) {
        logger.error(`Error deleting file ${filename}:`, err.message)
        return false
    }
}

function writeChunks(outputDir, prefix, ym, chunks) {
    if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true })

    if (chunks.length === 1) {
        const outputFilename = path.join(outputDir, `${prefix}_${ym}.json`)
        fs.writeFileSync(outputFilename, JSON.stringify(chunks[0], null, 2))
        logger.info(`Created ${outputFilename} (${chunks[0].length} items)`)
    } else {
        chunks.forEach((chunk, idx) => {
            const outputFilename = path.join(outputDir, `${prefix}_${ym}_${idx + 1}.json`)
            fs.writeFileSync(outputFilename, JSON.stringify(chunk, null, 2))
            logger.info(`Created ${outputFilename} (${chunk.length} items)`)
        });
    }
}

module.exports = {
    groupFilesByMonth,
    readRecordsFromFiles,
    writeChunks,
    getRecords,
    deleteFile
}
