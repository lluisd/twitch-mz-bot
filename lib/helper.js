const config = require("../config");
function isVip(context) {
    return context['vip'] || (context.badges && context.badges.vip)
}

function isMod(context) {
    return context['mod']
}

function isBroadcaster(context) {
    return context['user-id'] === context['room-id']
}

function isAdmin(context){
    return config.whitelistAdmins.includes(context['user-id'])
}

function isEditor(context){
    return config.whitelistEditors.includes(context['user-id'])
}

module.exports = {
    isVip,
    isMod,
    isBroadcaster,
    isAdmin,
    isEditor
}
