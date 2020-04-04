/**
 * @author Daniel Melanson
 * @date 4/4/2020
 * @desc Helper methods used by multiple commands, that define behaviour surrounding classes and roles.
 */

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

    /**
     * If the str is a string that represents a miscellaneous role.
     * @param str
     * @returns {boolean}
     */
    isMisc(str) {
        return new RegExp(/(snooper|daily coding problems)/i).test(str);
    }
};