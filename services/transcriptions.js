const { BlobServiceClient } = require('@azure/storage-blob');
const moment = require('moment');
const config = require('../config')
const {Buffer} = require("buffer");
const { Readable } = require('stream');
const logger = require('../lib/logger')
const {removeConsecutiveDuplicates, removeRepeatedBlocks, buildHybridChunks, addOverlap} = require("../helpers/cleaner");
const path = require("path");
const {readRecordsFromFiles, getRecords, deleteFile} = require("../helpers/files");
const fs = require("fs");

async function deleteBlobs (blobNames) {
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.blobStorage.connectionString);
    const containerClient = blobServiceClient.getContainerClient(config.blobStorage.containerName);

    const blobs = containerClient.listBlobsFlat();
    for await (const blob of blobs) {
        if (blobNames.includes(blob.name)) {
            const blockBlobClient = containerClient.getBlockBlobClient(blob.name);
            await blockBlobClient.delete();
        }
    }
}

async function uploadBlob (filename, json){
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.blobStorage.connectionString)
    const containerClient = blobServiceClient.getContainerClient(config.blobStorage.containerName)
    const blockBlobClient = containerClient.getBlockBlobClient(filename)

    const readableStream = Readable.from([json])
    const uploadBlobResponse = await blockBlobClient.uploadStream(readableStream)
    logger.info(`Upload block blob ${filename} successfully`, uploadBlobResponse.requestId)
}

async function deleteFiles (fileNames) {
    try {
        const dir = path.join(__dirname,'..', 'azure')
        for (const file of fileNames) {
            deleteFile(dir, file);
        }
    } catch (err) {
        logger.error(`Error deleting files:`, err.message)
    }
}

async function getFiles() {
    const streamFiles = path.join(__dirname, '..', 'azure')
    const pattern = /whisper-live(?:-(twitch|kick))?(\d{8})-(\d{6})\.json/
    let fileNames = []
    let jsons = {}

    try {
        const files  = fs.readdirSync(streamFiles)
        const matchedFiles = files .filter(file => pattern.test(file))

        for (const file of matchedFiles) {
            fileNames.push(file)
            const match = file.match(pattern)
            const platform = match[1] // 'twitch' or 'kick' or undefined
            const date = match[2] // '20241109'
            const time = match[3] // '143907'

            const datetimeStr = `${date}-${time}`
            const dateTime = moment(datetimeStr, 'YYYYMMDD-HHmmss', 'Europe/Madrid').toISOString()

            const filePath = path.join(streamFiles, file)
            const content = fs.readFileSync(filePath, "utf8")
            const data = JSON.parse(content)

            const segments = data.segments;
            jsons[date] = jsons[date] || {}
            jsons[date][time] = {
                segments: segments,
                dateTime: dateTime
            };
        }

        let mergedJsons = {}

        for (const date in jsons) {
            if (jsons.hasOwnProperty(date)) {
                const sortedTimes = Object.keys(jsons[date]).sort((a, b) => Number(a) - Number(b))
                let mergedSegments = []
                for (const time of sortedTimes) {
                    const chunks = buildHybridChunks(jsons[date][time].segments, jsons[date][time].dateTime)
                    //const chunks = addOverlap(chunks, 0.15)

                    const segments = chunks.map(segment => ({
                        nick: config.twitch.channels,
                        text: segment.text.trimStart(),
                        date: segment.startTimeAbsolute
                    }))

                    mergedSegments = mergedSegments.concat(segments)
                }

                mergedJsons[date] = JSON.stringify(mergedSegments)
            }
        }

        return { mergedJsons, fileNames }


    } catch (err) {
        logger.error(`Error reading files from ${streamFiles}:`, err.message)
    }
}

async function getBlobs() {
    const blobServiceClient = BlobServiceClient.fromConnectionString(config.blobStorage.connectionString);
    const containerClient = blobServiceClient.getContainerClient(config.blobStorage.containerName);

    const pattern = /whisper-live(\d{8})-(\d{6})\.text/;

    let jsons = {}
    let blobNames = []
    const blobs = containerClient.listBlobsFlat();
    for await (const blob of blobs) {
        const blobName = blob.name;
        const match = blobName.match(pattern)
        if (match) {
            blobNames.push(blobName);
            const date = match[1]; // '20241109'
            const time = match[2]; // '143907'

            const blockBlobClient = containerClient.getBlockBlobClient(blobName);

            const datetimeStr = blobName.split('whisper-live')[1].split('.')[0];
            const dateTime = moment(datetimeStr, 'YYYYMMDD-HHmmss').toISOString();

            const downloadBlockBlobResponse = await blockBlobClient.download(0);
            const downloaded = (
                await streamToBuffer(downloadBlockBlobResponse.readableStreamBody)
            ).toString();

            const lines = downloaded.toString().split('\r\n');

            const modifiedLines = lines.map(line => ({
                nick: config.twitch.channels,
                text: line,
                date: dateTime
            }));

            //const jsonData = JSON.stringify(modifiedLines);

            jsons[date] = jsons[date] || {};
            jsons[date][time] = modifiedLines;
        }
    }

    let mergedJsons = {};

    for (const date in jsons) {
        if (jsons.hasOwnProperty(date)) {
            const sortedTimes = Object.keys(jsons[date]).sort((a, b) => Number(a) - Number(b))
            let mergedObject = [];
            for (const time of sortedTimes) {
                mergedObject= mergedObject.concat(jsons[date][time])
            }

            let cleaned = removeConsecutiveDuplicates(mergedObject)
            cleaned = removeRepeatedBlocks(cleaned)

            mergedJsons[date] = JSON.stringify(cleaned)
        }
    }

    return { mergedJsons, blobNames }
}

// [Node.js only] A helper method used to read a Node.js readable stream into a Buffer
async function streamToBuffer(readableStream) {
    return new Promise((resolve, reject) => {
        const chunks = [];
        readableStream.on("data", (data) => {
            chunks.push(data instanceof Buffer ? data : Buffer.from(data));
        });
        readableStream.on("end", () => {
            resolve(Buffer.concat(chunks));
        });
        readableStream.on("error", reject);
    });
}


module.exports = {
    getBlobs,
    deleteBlobs,
    uploadBlob,
    getFiles,
    deleteFiles
}
