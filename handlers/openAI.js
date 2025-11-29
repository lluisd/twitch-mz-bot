const OpenAIResponsesApiService = require('../services/openAIResponsesApi')
const OpenAIService = require('../services/openAI')
const QdrantService = require('../services/qdrant')
const LoggerService = require('../services/logger')
const TranscriptionsService = require('../services/transcriptions')
const moment = require("moment-timezone")
const config = require("../config")
const logger = require('../lib/logger')
const path = require("path")
const {groupFilesByMonth, readRecordsFromFiles, writeChunks} = require("../helpers/files");
const {mergeAndClean} = require("../helpers/merger")
const {fetchRecordsFromVectorStore, deleteRecordsFromVectorStore} = require("../helpers/vectorStores")

class OpenAI {
    async askTest(target, text, username, twitchBot) {
         await OpenAIResponsesApiService.test()
    }

    async askOpenAI (target, text, username, twitchBot) {
        const response  = await OpenAIResponsesApiService.ask(text, username)
        if (response) {
            if (username) {
                await twitchBot.say(target, `@${username} ${response}`)
            } else {
                await twitchBot.say(target, `${response}`)
            }

        }
    }

    async processChats(target, twitchBot, startDateStr, endDateStr) {
        const start = moment.tz(startDateStr, 'YYYY-MM-DD', 'Europe/Madrid')
        const end = moment.tz(endDateStr, 'YYYY-MM-DD', 'Europe/Madrid')

        if (!start.isValid() || !end.isValid()) {
            logger.error('Invalid date format. Please use YYYY-MM-DD.')
            return
        }
        if (start.isAfter(end)) {
            logger.error('The start date must be before or equal to the end date.')
            return
        }

        const startOfRange = start.startOf('day').toDate()
        const endOfRange = end.endOf('day').toDate()


        let response = await LoggerService.getLogChatMessagesBetweenDays(
            config.twitch.roomId,
            startOfRange,
            endOfRange
        );

        if (response.length === 0) return;

        response = await LoggerService.joinConsecutiveMessagesByNickWithPause(response, 30);

        const json = JSON.stringify(response);

        const rangeLabel = `${start.format('YYYY-MM-DD')}_to_${end.format('YYYY-MM-DD')}`;
        const result = await QdrantService.uploadJsonToQdrant(json, rangeLabel, 'chat');
        if (result.success) {
            logger.info(`Chat uploaded to OpenAI ${result.filename}`);
        } else {
            logger.error(`Error uploading chat for range ${rangeLabel}`);
        }
    }

    async createAndUploadToChat (target, twitchBot, isToday = false) {
        const today = moment().tz('Europe/Madrid')
        const date = isToday ? today : today.subtract(1, 'days')
        const startOfDay = date.startOf('day').toDate();
        const endOfDay = date.endOf('day').toDate();

        let response = await LoggerService.getLogChatMessagesBetweenDays(config.twitch.roomId, startOfDay, endOfDay)
        if (response.length === 0 ) return
        response = await LoggerService.joinConsecutiveMessagesByNickWithPause(response, 30)
        const json = JSON.stringify(response)

        const formattedDate = date.format('YYYY-MM-DD');

        const result = await QdrantService.uploadJsonToQdrant(json, formattedDate, 'chat')
        const result2 = await OpenAIService.uploadFileToVectorStore(json, formattedDate, 'chat')

        if (result.success) {
            await twitchBot.say(target, `IA actualizada con el chat de ${formattedDate}`)
            logger.info('Chat uploaded to openai ' + result.filename)
        } else {
            logger.error('Error uploading chat to openai of date ' + formattedDate)
        }
    }

    async initiateVector () {
        await QdrantService.createCollection()
        logger.info('Initializing vector')
    }

    async uploadStreamToQdrant (target, twitchBot, telegramBot) {
        const { mergedJsons, blobNames } = await TranscriptionsService.getFiles()
        let error = false
        for (const date in mergedJsons) {
            if (mergedJsons.hasOwnProperty(date)) {
                const formattedDate = moment(date, 'YYYYMMDD').format('YYYY-MM-DD')
                const result = await QdrantService.uploadJsonToQdrant(mergedJsons[date], formattedDate, 'stream')
                if (result.success) {
                    const message = `📼 IA actualizada con el stream de ${formattedDate}`
                    //await twitchBot.say(target, message)
                    //await telegramBot.sendMessage(config.telegram.chatId, message, { parse_mode: 'Markdown' })

                    logger.info('Stream uploaded to qdrant ' + result.filename)
                } else {
                    error = true
                    logger.error('Error uploading stream to qdrant of date ' + formattedDate + ' error:' + result.error)
                }
            }
        }

        if (!error) {
            //await TranscriptionsService.deleteFiles(blobNames)
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
            const chunks = await mergeAndClean(prefix, records);

            writeChunks(outputDir, prefix, ym, chunks);
        }

        logger.info(`File mode completed for prefix "${prefix}".`);
    }

    async _handleVectorMode(prefix) {
        const records = await fetchRecordsFromVectorStore(prefix);

        for (const [ym, json] of Object.entries(records.grouped)) {
            const chunks = await mergeAndClean(prefix, json.flat());
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
}

module.exports = OpenAI
