const fs = require('fs');
const path = require('path');

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
    const match = file.match(/^chat_(\d{4}-\d{2})-\d{2}\.json$/);
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

    // Optional: sort by "date"
    merged.sort((a, b) => new Date(a.date) - new Date(b.date));

    const outputFilename = path.join(outputDir, `chat_${ym}.json`);
    fs.writeFileSync(outputFilename, JSON.stringify(merged, null, 2), 'utf-8');
    console.log(`Created ${outputFilename} with ${merged.length} items.`);
});