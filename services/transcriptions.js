const { BlobServiceClient } = require('@azure/storage-blob');
const moment = require('moment');
const config = require('../config')
const {Buffer} = require("buffer");
const { Readable } = require('stream');

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
    console.log(`Upload block blob ${filename} successfully`, uploadBlobResponse.requestId)
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
                nick: 'manzana_oscura',
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
            mergedJsons[date] = JSON.stringify(mergedObject)
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
    uploadBlob
}
