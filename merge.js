const fs = require('fs');
const path = require('path');

const prefix = process.argv[2] || "chat";

// Input and output directories
const inputDir = path.join(__dirname, 'files');
const outputDir = path.join(__dirname, 'merged');

// Create output dir if it doesn't exist
if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir);
}

// Group files by YYYY-MM
const files = fs.readdirSync(inputDir);
const grouped = {};

files.forEach(file => {
    const match = file.match(new RegExp(`^${prefix}_(\\d{4}-\\d{2})-\\d{2}\\.json$`));
    if (match) {
        const ym = match[1];
        if (!grouped[ym]) grouped[ym] = [];
        grouped[ym].push(file);
    }
});

// Merge and save
Object.entries(grouped).forEach(([ym, fileList]) => {
    let merged = [];

    fileList.forEach(file => {
        const fullPath = path.join(inputDir, file);
        try {
            const content = fs.readFileSync(fullPath, 'utf-8');
            const data = JSON.parse(content);
            if (Array.isArray(data)) {
                merged = merged.concat(data);
            }
        } catch (err) {
            console.error(`Failed to parse ${file}:`, err.message);
        }
    });

    merged.sort((a, b) => new Date(a.date) - new Date(b.date));

    const MAX_SIZE = 5 * 1024 * 1024;
    let part = 1;
    let chunk = [];
    let currentSize = 2;

    const outputs = [];

    merged.forEach(item => {
        const itemStr = JSON.stringify(item, null, 2);
        const itemSize = Buffer.byteLength(itemStr, 'utf8') + 2;

        if (currentSize + itemSize > MAX_SIZE && chunk.length > 0) {
            outputs.push(chunk);
            part++;
            chunk = [];
            currentSize = 2;
        }

        chunk.push(item);
        currentSize += itemSize;
    });

    if (chunk.length > 0) {
        outputs.push(chunk);
    }

    if (outputs.length === 1) {
        const outputFilename = path.join(outputDir, `${prefix}_${ym}.json`);
        fs.writeFileSync(outputFilename, JSON.stringify(outputs[0], null, 2), 'utf-8');
        console.log(`Created ${outputFilename} with ${outputs[0].length} items.`);
    } else {
        outputs.forEach((chunk, idx) => {
            const outputFilename = path.join(outputDir, `${prefix}_${ym}_${idx + 1}.json`);
            fs.writeFileSync(outputFilename, JSON.stringify(chunk, null, 2), 'utf-8');
            console.log(`Created ${outputFilename} with ${chunk.length} items.`);
        });
    }
});