class InputParser {
    isAskingForRollDice (text) {
        return text === ('!dados')
    }

    isAskingForSunset (text) {
        return text.startsWith('!sunset') || text.startsWith('!ocaso') || text.startsWith('!atardecer')
    }
}

module.exports = InputParser
