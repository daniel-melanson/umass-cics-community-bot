/**
 * @author Daniel Melanson
 * @date 4/6/2020
 * @desc Scrapes the UMass CICS website for classes, caches information.
 */

// Modules
const fetch = require('node-fetch');
const cheerio = require('cheerio');

let cache = {};

/**
 * This is a mess and I plan to redo it
 * @param semester
 * @param year
 * @returns {Promise<void>}
 */
async function scrapeSemester(semester, year) {
    const res = await fetch(`https://www.cics.umass.edu/content/${semester}-${year}-course-descriptions`);
    const data = await res.text();
    let $ = cheerio.load(data);

    let ids = [];
    let titles = [];
    let instructors = [];
    let descriptions = [];

    let step = 0;
    $('.field-item').children().each((i, elem) => {
        let text = $(elem).text();

        if (step === 1) { // text is description
            descriptions.push(text);
            step--;
        } else if (step === 2) { // text is instructions
            let match = text.match(/(?<=Instructor\(s\): ).+$/);

            if (match) {
                instructors.push(match[0]);
            } else {
                instructors.push('None');
            }

            step--;
        } else { // text is possibly a title
            let match = text.match(/^(cics|compsci|info) \d{3}\w*(?=:)/i);

            if (match) {
                ids.push(match[0].replace('COMPSCI', 'CS'));
                titles.push(text.match(/(?<=: ).+$/i)[0]);

                step = 2;
            }
        }
    });


    for (let i = 0; i < ids.length; i++) {
        let classId = ids[i];

        cache[classId] = {
            name: classId,
            title: titles[i].trim(),
            instructors: instructors[i].trim(),
            description: descriptions[i].trim(),
            semester: `${semester.toUpperCase()} 20${year}`
        }
    }
}

/**
 * Scrape the UMass CICS website for information.
 * @returns {Promise<void>}
 */
async function scrape() {
    let now = new Date();
    let year = now.getFullYear();
    let month = now.getMonth();

    // This does not work if we go back in time
    for (let i = 2018; i <= year; i++) {
        for (let semester of ['spring', 'fall']) {
            if (i < year || (semester === 'spring' && month < 5 || semester === 'fall' && month >= 5)) {
                await scrapeSemester(semester, i - 2000);
            }
        }
    }
}

let nextCache = new Date();
/**
 * Check to see if we need to update, if we do then scrape
 * @returns {Promise<void>}
 */
async function updateCache() {
    if (new Date() > nextCache) {
        try {
            await scrape();
            nextCache = new Date(nextCache.setDate(nextCache.getDate() + 1));
        } catch (e) { }
    }
}

/**
 * Gets a class from the cache, see if we need to update first
 * @param id
 * @returns {Promise<*>}
 */
async function getClass(id) {
    await updateCache();

    return cache[id];
}

module.exports = {
    getClass: getClass,
    getClassList: async () => {
        await updateCache();

        return Object.getOwnPropertyNames(cache);
    }
};