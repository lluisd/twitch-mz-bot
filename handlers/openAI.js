const OpenAIService = require('../services/openAI')
const LoggerService = require('../services/logger')
const TranscriptionsService = require('../services/transcriptions')
const moment = require("moment/moment")
const config = require("../config")
const logger = require('../lib/logger')
const path = require("path")
const {groupFilesByMonth, readRecordsFromFiles, writeChunks} = require("../helpers/files");
const {mergeAndClean} = require("../helpers/merger")
const {fetchRecordsFromVectorStore, deleteRecordsFromVectorStore} = require("../helpers/vectorStores")

class OpenAI {
    async askOpenAI (target, text, username, twitchBot) {
        const response  = await OpenAIService.askAssistant(text, username)
        if (response) {
            if (username) {
                await twitchBot.say(target, `@${username} ${response}`)
            } else {
                await twitchBot.say(target, `${response}`)
            }

        }
    }

    async createAndUploadToChat (target, twitchBot, isToday = false) {
        const today = moment().tz('Europe/Madrid')
        const date = isToday ? today : today.subtract(1, 'days')
        const startOfDay = date.startOf('day').toDate();
        const endOfDay = date.endOf('day').toDate();

        const response = await LoggerService.getLogChatMessagesBetweenDays(config.twitch.roomId, startOfDay, endOfDay)
        if (response.length === 0 ) return
        const json = JSON.stringify(response)

        const formattedDate = date.format('YYYY-MM-DD');
        const result = await OpenAIService.uploadFileToVectorStore(json, formattedDate, 'chat')
        if (result.success) {
            await twitchBot.say(target, `IA actualizada con el chat de ${formattedDate}`)
            logger.info('Chat uploaded to openai ' + result.filename)
        } else {
            logger.error('Error uploading chat to openai of date ' + formattedDate)
        }
    }

    async uploadStreamToOpenai (target, twitchBot, telegramBot) {
        const { mergedJsons, blobNames } = await TranscriptionsService.getBlobs()
        let error = false
        for (const date in mergedJsons) {
            if (mergedJsons.hasOwnProperty(date)) {
                const formattedDate = moment(date, 'YYYYMMDD').format('YYYY-MM-DD');
                const result = await OpenAIService.uploadFileToVectorStore(mergedJsons[date], formattedDate, 'stream')
                if (result.success) {
                    const message = `📼 IA actualizada con el stream de ${formattedDate}`;
                    await twitchBot.say(target, message)
                    await telegramBot.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' })

                    logger.info('Stream uploaded to openai ' + result.filename)
                } else {
                    error = true
                    logger.error('Error uploading stream to openai of date ' + formattedDate + ' error:' + result.error)
                }
            }
        }

        if (!error) {
            await TranscriptionsService.deleteBlobs(blobNames)
        }
    }

    async mergePreviousMonthsUploadedVectorFilesByMonth(mode = 'vector', prefix = 'chat') {
        try {
            switch (mode) {
                case 'files':
                    await this._handleFileMode(prefix)
                    break;

                case 'vector':
                    await this._handleVectorMode(prefix);
                    break;

                default:
                    console.error("Usage: node merge.js [files|vector] [prefix]");
            }
        } catch (err) {
            logger.error(`Error during merge: ${err.message}`, err);
        }
    }

    /**
     * Handles merging from local files mode
     */
    async _handleFileMode(prefix) {
        const inputDir = path.join(__dirname, 'files');
        const outputDir = path.join(__dirname, 'merged');
        const grouped = groupFilesByMonth(inputDir, prefix);

        for (const [ym, fileList] of Object.entries(grouped)) {
            const records = readRecordsFromFiles(inputDir, fileList);
            const chunks = await mergeAndClean(records);
            writeChunks(outputDir, prefix, ym, chunks);
        }

        logger.info(`File mode completed for prefix "${prefix}".`);
    }

    async _handleVectorMode(prefix) {
        const records = await fetchRecordsFromVectorStore(prefix);

        for (const [ym, json] of Object.entries(records.grouped)) {
            const chunks = await mergeAndClean(json.flat());
            await this._uploadChunksToVectorStore(chunks, ym, prefix);
        }

        await this._cleanUpOldVectorFiles(records.fileIds);
        logger.info(`Uploaded chunks to vector store for prefix "${prefix}".`);
    }

    async _uploadChunksToVectorStore(chunks, ym, prefix) {
        const uploadPromises = chunks.map(async (chunk, index) => {
            const name = chunks.length === 1 ? ym : `${ym}_${index + 1}`;
            const jsonString = JSON.stringify(chunk, null, 2);
            const result = await OpenAIService.uploadFileToVectorStore(jsonString, name, prefix);

            if (result.success) {
                logger.info(`${prefix} uploaded to OpenAI: ${result.filename}`);
            } else {
                logger.error(`Error uploading ${prefix} for date ${name}`);
            }
        });

        await Promise.all(uploadPromises);
    }

    async _cleanUpOldVectorFiles(fileIds = []) {
        for (const fileId of fileIds) {
            try {
                await deleteRecordsFromVectorStore(fileId);
            } catch (err) {
                logger.warn(`Failed to delete vector file ${fileId}: ${err.message}`);
            }
        }
    }

    async mergePreviousMonthsUploadedVectorFilesByMonthW (mode = 'vector', prefix = 'chat') {
        if (mode === 'files') {
            const inputDir = path.join(__dirname, 'files');
            const outputDir = path.join(__dirname, 'merged');
            const grouped = groupFilesByMonth(inputDir, prefix);

            for (const [ym, fileList] of Object.entries(grouped)) {
                const records = readRecordsFromFiles(inputDir, fileList);
                const chunks = await mergeAndClean(records);
                writeChunks(outputDir, prefix, ym, chunks);
            }
        } else if (mode === 'vector') {
            const records = await fetchRecordsFromVectorStore(prefix)

            for (const [ym, json] of Object.entries(records.grouped)) {
                const records = json.flat()
                const chunks = await mergeAndClean(records)

                if (chunks.length === 1) {
                    const jsonString = JSON.stringify(chunks[0], null, 2)
                    const result = await OpenAIService.uploadFileToVectorStore(jsonString, ym, prefix)
                    if (result.success) {
                        logger.info(prefix + ' uploaded to openai ' + result.filename)
                    } else {
                        logger.error('Error uploading chat to openai of date ' + ym)
                    }
                } else {
                    for (const chunk of chunks) {
                        const idx = chunks.indexOf(chunk);
                        const name = `${ym}_${idx + 1}`
                        const jsonString = JSON.stringify(chunk, null, 2)
                        const result = await OpenAIService.uploadFileToVectorStore(jsonString, name, prefix)
                        if (result.success) {
                            logger.info(prefix + ' uploaded to openai ' + result.filename)
                        } else {
                            logger.error('Error uploading chat to openai of date ' + name)
                        }
                    }
                }
            }

            for (const fileId of records.fileIds) {
                await deleteRecordsFromVectorStore(fileId);
            }

            console.log(`Uploaded chunks to vector store.`);
        } else {
            console.error("Usage: node merge.js [files|vector] [prefix]");
        }
    }
}

module.exports = OpenAI
