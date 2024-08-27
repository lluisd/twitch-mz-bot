const handlers = require("../handlers");
const InputParser = require('./inputParser')
const inputParser = new InputParser()

class TempsDeFlorsMessenger {
    constructor (bot, cooldown) {
        this.cooldown = cooldown
        this.bot = bot
    }

    async handleText (target, context, textSplit) {
        if (this.textSplit.length > 1 && inputParser.isAskingForTFSpot(textSplit[0]) && _isNotCooldown(this.cooldown.tf, 15))
            return handlers.tempsDeFlors.getSpot(target, textSplit[1], this.bot, context['room-id'])

        if (textSplit.length > 0 && inputParser.isAskingForTFSpotsCount(textSplit[0]) && _isNotCooldown(this.cooldown.tf, 15))
            return handlers.tempsDeFlors.getTotalSpot(target, this.bot, context['room-id'])

        if (textSplit.length > 1 && inputParser.isAskingForTFVisited(textSplit[0]) &&
            (this._isVip(context) || this._isMod(context) || this._isBroadcaster(context)))
            return handlers.tempsDeFlors.setVisited(target, textSplit[1], this.bot, context['room-id'], true)

        if (textSplit.length > 1 && inputParser.isAskingForTFNotVisited(textSplit[0]) &&
            (this._isMod(context) || this._isBroadcaster(context)))
            return handlers.tempsDeFlors.setVisited(target, textSplit[1], this.bot, context['room-id'], false)

        if (textSplit.length > 0 && inputParser.isAskingForTFDeactivateSpot(textSplit[0]) &&
            (this._isVip(context) || this._isMod(context) || this._isBroadcaster(context)))
            return handlers.tempsDeFlors.setDeactivate(target, this.bot)

        if (textSplit.length > 1 && inputParser.isAskingForTFActiveSpot(textSplit[0]) &&
            (this._isVip(context) || this._isMod(context) || this._isBroadcaster(context)))
            return handlers.tempsDeFlors.setActive(target, textSplit[1], this.bot, context['room-id'])

        if (textSplit.length > 0 && inputParser.isAskingForShowScreenshots(textSplit[0]))
            return handlers.stream.getScreenshots(target, this.bot)

        if (textSplit.length > 0 && inputParser.isAskingForTFScreenshot(textSplit[0]) && _isNotCooldown(this.cooldown.screenshotTF, 30, this.cooldown.screenshot) &&
            await handlers.tempsDeFlors.hasActiveSpot())
            return handlers.tempsDeFlors.captureScreenshot(target, textSplit[1], this.bot, context['display-name'], context['room-id'])

        return false
    }
}


function _isNotCooldown (cooldown, seconds = 3, extraCooldown) {
    if (!cooldown) {
        cooldown = true
        if (extraCooldown) extraCooldown = true
        setTimeout(() => {
            cooldown = false
            if (extraCooldown) extraCooldown = false
        }, seconds * 1000)
        return true;
    }
    return false;
}

module.exports = TempsDeFlorsMessenger
