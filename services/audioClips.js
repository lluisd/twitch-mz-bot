const fs = require('fs/promises')
const path = require('path')
const { createHash, randomUUID } = require('crypto')
const { execFile } = require('child_process')
const { promisify } = require('util')

const run = promisify(execFile)
const audioDirectory = path.join(__dirname, '..', 'audio')
const clipsDirectory = path.join(__dirname, '..', 'public', 'audio')
let generating = false

async function createClip(session, start, duration) {
    if (typeof session !== 'string' || !/^whisper-live(?:-(?:twitch|kick)-)?\d{8}-\d{6}$/.test(session) ||
        !Number.isFinite(start) || start < 0 || !Number.isFinite(duration) || duration <= 0) {
        throw Object.assign(new Error('Provide a valid session, start >= 0 and duration > 0 in seconds.'), { status: 400 })
    }

    const source = path.join(audioDirectory, `${session}.wav`)
    try {
        await fs.access(source)
    } catch (error) {
        if (error.code === 'ENOENT') {
            throw Object.assign(new Error('Source WAV not found.'), { status: 404 })
        }
        throw error
    }

    const id = createHash('sha256').update(JSON.stringify([session, start, duration])).digest('hex')
    const filename = `${id}.mp3`
    const output = path.join(clipsDirectory, filename)
    const url = `/audio/${filename}`
    try {
        await fs.access(output)
        return url
    } catch (error) {
        if (error.code !== 'ENOENT') throw error
    }

    if (generating) {
        throw Object.assign(new Error('Another audio clip is being generated. Please retry shortly.'), { status: 503 })
    }

    generating = true
    const temporary = path.join(clipsDirectory, `${randomUUID()}.tmp`)
    try {
        await fs.mkdir(clipsDirectory, { recursive: true })
        await run('ffmpeg', [
            '-nostdin', '-hide_banner', '-loglevel', 'error',
            '-ss', String(start), '-i', source, '-t', String(duration),
            '-vn', '-c:a', 'libmp3lame', '-b:a', '128k',
            '-abort_on', 'empty_output', '-f', 'mp3', temporary
        ], { timeout: 120000, maxBuffer: 1024 * 1024 })
        await fs.rename(temporary, output)
        return url
    } finally {
        generating = false
        await fs.rm(temporary, { force: true })
    }
}

module.exports = { createClip }
