const Discord = require("discord.js");

const EMBED_CONSTANTS = {
    NAME: 'University of Massachusetts Amherst College of Information and Computer Science',
    IMAGE: '/assets/image.png',
    COLOR:  [131, 35, 38]
};

/**
 * If @param str is a string that represents a CICS related class.
 * @param str
 * @returns {boolean}
 */
function isClass(str) {
    return new RegExp(/(cs|math|stat|cics)\s*\d{3}\w*/i).test(str.trim());
}

module.exports = {
    isClass: isClass,

    /**
     * If @param str is a string that represents a residential area.
     * @param str The string to check
     * @returns {boolean}
     */
    isResidential(str) {
        return new RegExp(/(central|ohill|northeast|southwest|honors|sylvan|off-campus)/i).test(str.trim());
    },

    /**
     * If @param str is a string that represents a graduating class or graduation status.
     * @param str
     * @returns {boolean}
     */
    isGraduatingStatus(str) {
        return new RegExp(/(alumni|class of \d{4})/i).test(str.trim()); // This code does not support graduation dates past 9999 🤔
    },

    /**
     * If the str is a string that represents a CS class.
     * @param str
     * @returns {boolean}
     */
    isCSClass(str) {
        return isClass(str) && !!str.trim().match(/^(cs|cicis|info)/mi)
    },

    /**
     * If the str is a string that represents a math class.
     * @param str
     * @returns {boolean}
     */
    isMathClass(str) {
        return isClass(str) && !!str.trim().match(/^(math|stat)/mi);
    },

    /**
     * If the str is a string that represents a interdisciplinary topic.
     * @param str
     * @returns {boolean}
     */
    isInterdisciplinary(str) {
        return new RegExp(/(buisness|biology|economics|engineering|linguistics|phychology|informatics)/i).test(str.trim());
    },

    isMisc(str) {
        return new RegExp(/(Snooper|Daily Coding Problems)/i).test(str);
    },

    /**
     * Returns a embed formatted for guild use.
     * @param options
     * @returns {object}
     */
    getEmbed(options) {
        let embed = new Discord.MessageEmbed({
            author: options.author || {

            },
            createdAt: options.createdAt,
            description: options.description,
            fields: options.fields,
            image: options.image || EMBED_CONSTANTS.IMAGE,
            title: options.title,
            timestamp: new Date()
        });

        embed.setColor(options.hexColor || EMBED_CONSTANTS.COLOR);

        return {embed: embed};
    }
};