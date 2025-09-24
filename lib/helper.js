const config = require("../config");
function isVip(context) {
    return context.userInfo.isVip || (context.badges && context.userInfo.badges.get('vip'))
}

function isMod(context) {
    return context.userInfo.isMod
}

function isBroadcaster(context) {
    return context.userInfo.isBroadcaster
}

function isAdmin(context){
    return config.whitelistAdmins.includes(context.userInfo.userId)
}

function isEditor(context){
    return config.whitelistEditors.includes(context.userInfo.userId)
}

module.exports = {
    isVip,
    isMod,
    isBroadcaster,
    isAdmin,
    isEditor
}
