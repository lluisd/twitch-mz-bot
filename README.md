# twitch-mz-bot

A twitch chatbot to get specific information about weather predictions and other information.

Status: https://mz-status.311312.xyz/


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

```code
!bans
//result: a**a, as**sd ban requests pending
```

```code
!ban username //bans username from the cannel
!timeout username //bans username during 600 (by default) seconds 
!timeout username 60 //bans username during 60 seconds

!unban username //removes the ban of the given username
```
