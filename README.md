# twitch-mz-bot

A twitch chatbot to get specific information about weather predictions, take screenshots, manage stream, manage bans and other random formation.

Bot status: https://mz-status.311312.xyz/

## Stream audio clips

Mount the original WAV directory read-only at `/usr/src/app/audio`. Filenames must
match the transcription session, for example
`whisper-live-kick-20260604-213400.wav`. The WAV and transcript must share the same
starting point. Rebuild the Docker image to install FFmpeg.

`POST /audio-clips` uses the existing Basic Auth credentials and accepts:

```json
{
  "session": "whisper-live-kick-20260604-213400",
  "start": 3.87,
  "duration": 3.3
}
```

`start` is the offset into the WAV in seconds, not an absolute date. Transcription
records in Qdrant include `start` and `duration` for this purpose; re-upload
existing sessions with force enabled to add these fields.

The response contains `{ "url": "https://your-host/audio-clips/<id>.mp3" }`,
using `EXTERNAL_URL`. Anyone with this URL can play or download the clip without
authentication. Original WAV files are not publicly served.

Clips are cached in `public/audio-clips`; identical requests reuse the same file.
Only one new clip is generated at a time (other generation requests receive
`503` and should retry). Invalid parameters return `400`, missing WAVs `404`,
and generation failures `500`. FFmpeg has a two-minute execution timeout.

Optionally mount a persistent volume at `/usr/src/app/public/audio-clips` and
ensure it is writable by the container's `node` user (UID 1000). Otherwise clips
are lost when the container is replaced. Delete old MP3s from this directory
periodically to reclaim disk space; requests for deleted clips regenerate them.

## Newsletter subscriber webhook

`POST /newsletterWebhook` (Basic Auth with `BASIC_AUTH_USERNAME`/`BASIC_AUTH_PASSWORD`) announces a new
Listmonk subscriber in Kick chat: "¡Tenemos un nuevo suscriptor a la newsletter! ¡Ya somos {totalSubs} suscriptores!".
The email and name are never posted to chat.

In n8n use an HTTP Request node: method `POST`, URL `{EXTERNAL_URL}/newsletterWebhook`,
Authentication `Basic Auth`, JSON body:

```json
{ "email": "user@example.com", "name": "User", "totalSubs": 22 }
```

Responses: `200` sent, `400` invalid `totalSubs`, `401/403` bad credentials, `503` Kick disabled.

## Newsletter command (Kick)

- `!newsletter` → link to the newsletter (`LISTMONK_PUBLIC_URL`, default `https://manza.news`).
- `!newsletter N` → archive link of the N-th published campaign (oldest first), e.g. `https://manza.news/archive/{archive_slug}`.
  Only campaigns with status `finished` and archive enabled are counted.

Environment variables: `LISTMONK_URL` (Listmonk base URL for the API), `LISTMONK_API_USER`, `LISTMONK_API_TOKEN`, `LISTMONK_PUBLIC_URL`.

## environment variables

```javascript
TWITCH_CLIENT_ID //twitch client id from your chatbot app (https://dev.twitch.tv/)
TWITCH_CLIENT_SECRET //twitch client secret from you chatbot app
TWITCH_CHANNELS //channels to automatically join separated by comma
TWITCH_USER_ID //twitch user id (https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
MONGODB_URI //mongoodb uri for the access/refresh tokens.
AEMET_API_KEY //aemet api key to get spanish weather (https://opendata.aemet.es/centrodedescargas/inicio)
PORT //port of the running app
TELEGRAM_TOKEN //Telegram bot API token to send notifications
TELEGRAM_CHAT_ID //Telegram chat id to send the notifications
EXTERNAL_URL //external url of the running app to create the public image urls
BROWSERLESS_URL //browserless websocket url to take screenshots
BROWSERLESS_TOKEN //browserless token
STATUS_URL //uptime url for /status tiwtch chat command
WHITE_LIST_ADMINS //twitch user ids seperated by comma to run ban/unban commands
WHITE_LIST_EDITORS //twitch user ids seperated by comma to run !title/!game commands
FEATURE_TF_SPOTS //true/false to enable/disable the tf spots feature
```

## Weather
Information from weather comes from AEMET OpenData to get Spain weather predictions.

### commands
```code
!amanecer girona 
//result: Girona amanece a las 08:02
```

```code
!atardecer girona 
//result: Girona atardece a las 17:59
```

## Photo
Take a screenshot of the current stream and send it to the chat.

### commands

```code
!foto
//result: https://external.url/i/cclj35.jpg
```

(only VIP, Mods and Broadcaster users)
```code
!f5 //refreshes ghost browser to screenshots if it hangs
```

## Birthday
Save your own birthdate and get other users birthdays

### commands

```code
!micumple 03-08
//result: @myuser cumple el dia 3 de Setiembre
```

```code
!cumple @otheruser
//result: @otheruser cumple el dia 3 de Setiembre
```

## Bans
Get band requests, ban, unban, timeout

### commands

(only VIP, Mods and Broadcaster users)
```code
!bans
//result: a**a, as**sd ban requests pending
```

(only users in the admin white list)
```code
!ban username //bans username from the cannel
!timeout username //bans username during 600 (by default) seconds 
!timeout username 60 //bans username during 60 seconds

!unban username //removes the ban of the given username
```

## Stream

Set stream title and game by using streamElements 

### commands
(only users in the editors white list)

```code
!titulo Testing title
```

```code
!categoria IRL
```
