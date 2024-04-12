# twitch-mz-bot

A twitch chatbot to get specific information about weather predictions, train timings and other information.

Status: https://uptime.311312.xyz/status/twitch 

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
MYSQL_HOST //mysql host ip/domain
MYSQL_USER //mysql user
MYSQL_PASSWORD //mysql password
MYSQL_DB //mysql database
STATUS_URL //uptime url for /status tiwtch chat command
```

## Weather
Information from weather comes from AEMET OpenData to get Spain weather predictions.

### commands
```javascript
!amanecer girona 
//result: Girona amanece a las 08:02
```

```javascript
!atardecer girona 
//result: Girona atardece a las 17:59
```

## Train
Find next departure time of the train from a given origin and destination. It uses the renfe GTFS dataset improved_gtfs.zip (https://gtfs.pro/en/spain/Renfe-Operadora/renfe)

### commands

```javascript
!md girona, sant celoni
//result: Próximo tren MD de Girona a Sant Celoni sale a las 14:49:00
```

```javascript
!ave girona, sants
//result: Próximo tren AVE de Girona a Barcelona-Sants sale a las 16:30:00
```

## Photo
Take a screenshot of the current stream and send it to the chat.

### commands

```javascript
!foto
//result: https://external.url/i/cclj35.jpg
```

## Birthday
Save your own birthdate and get other users birthdays

### commands

```javascript
!micumple 03-08
//result: @myuser cumple el dia 3 de Setiembre
```

```javascript
!cumple @otheruser
//result: @otheruser cumple el dia 3 de Setiembre
```
