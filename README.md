# twitch-mz-bot

A twitch chatbot to get specific information about weather predictions, train timings and other information.

## environment variables

```javascript
TWITCH_CLIENT_ID //twitch client id from your chatbot app (https://dev.twitch.tv/)
TWITCH_CLIENT_SECRET //twitch client secret from you chatbot app
TWITCH_CHANNELS //channels to automatically join separated by comma
TWITCH_USER_ID //twitch user id (https://www.streamweasels.com/tools/convert-twitch-username-to-user-id/)
MONGODB_URI //mongoodb uri for the access/refresh tokens.
AEMET_API_KEY //aemet api key to get spanish weather (https://opendata.aemet.es/centrodedescargas/inicio) 
SQL_CONNECTION //sql connection string for the train information
PORT //port of the running app
```

## Weather
Information from weather comes from AEMET OpenData to get Spain weather predictions.

### commands
```javascript
!atardecer girona 
//result: Girona atardece a las 17:59
```

## Train
Find next departure time of the train from a given origin and destination. It uses the renfe open datasets (https://data.renfe.com/)

### commands

```javascript
!md girona figueres
```

```javascript
!ave girona sants
```
