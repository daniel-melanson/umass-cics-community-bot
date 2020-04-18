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
    return new RegExp(/^(cs|math|stat|cics|info)\s*\d{3}[a-z]*$/i).test(str.trim());
}

/**
 * If @param str is a string that represents a residential area.
 * @param str The string to check
 * @returns {boolean}
 */
function isResidential(str) {
    return new RegExp(/^(central|ohill|northeast|southwest|honors|sylvan|off-campus)$/i).test(str.trim());
}

/**
 * If @param str is a string that represents a graduating class or graduation status.
 * @param str
 * @returns {boolean}
 */
function isGraduationStatus(str) {
    return new RegExp(/^(alumni|graduate student|class of \d{4})$/i).test(str.trim()); // This code does not support graduation dates past 9999 🤔
}

/**
 * If the str is a string that represents a CS class.
 * @param str
 * @returns {boolean}
 */
function isCSClass(str) {
    return isClass(str) && !!str.trim().match(/^(cs|cicis|info)/i)
}

/**
 * If the str is a string that represents a math class.
 * @param str
 * @returns {boolean}
 */
function isMathClass(str) {
    return isClass(str) && !!str.trim().match(/^(math|stat)/i);
}

/**
 * If the str is a string that represents a interdisciplinary topic.
 * @param str
 * @returns {boolean}
 */
function isInterdisciplinary(str) {
    return new RegExp(/^(business|biology|economics|engineering|linguistics|phychology|informatics)$/i).test(str.trim());
}

/**
 * If the str is a string that represents a miscellaneous role.
 * @param str
 * @returns {boolean}
 */
function isMisc(str) {
    return new RegExp(/^(snooper|daily coding problems|community events)$/i).test(str);
}

/**
 * If a user can assign the role to themselves
 * @param str
 * @returns {boolean}
 */
function isAssignable(str) {
    return isClass(str) || isInterdisciplinary(str) || isMisc(str) || isGraduationStatus(str) || isResidential(str);
}

/**
 * If a Permissions object has any exploitable flags.
 * @param permissions
 * @returns {boolean}
 */
function hasExploitable(permissions) {
    return permissions.any(['ADMINISTRATOR', 'KICK_MEMBERS', 'BAN_MEMBERS', `MANAGE_CHANNELS`, `MANAGE_GUILD`, `MANAGE_MESSAGES`, `MUTE_MEMBERS`, `DEAFEN_MEMBERS`, `MOVE_MEMBERS`, `MANAGE_NICKNAMES`, `MANAGE_ROLES`, `MANAGE_WEBHOOKS`, `MANAGE_EMOJIS`]);
}

/**
 * Tries to reset the permissions of a given role.
 * @param role The role to reset
 * @returns {Promise<boolean>} If we were successful
 */
async function resetPermissions(role) {
    try { // Try and remove that feature
        await role.setPermissions([]);
        return true;
    } catch (e) {
        return false;
    }
}

module.exports = {
    isClass: isClass,
    isResidential: isResidential,
    isGraduationStatus: isGraduationStatus,
    isCSClass: isCSClass,
    isMathClass: isMathClass,
    isInterdisciplinary: isInterdisciplinary,
    isMisc: isMisc,
    isAssignable: isAssignable,
    hasExploitable: hasExploitable,
    resetPermissions: resetPermissions
};