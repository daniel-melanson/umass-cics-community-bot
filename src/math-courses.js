/**
 * @author Larry Tseng
 * @date 5/12/2020
 * @desc Scrapes the UMass Mathematics website for course descriptions. Modeled off Daniel Melanson's CICS scraper.
 */

const fetch = require('node-fetch');
const cheerio = require('cheerio');
const baseURL = "https://www.math.umass.edu/course-descriptions/";

// const cachePeriod = 1000*60*60*24;  // 1 day
const cachePeriod = 0;

let cache = {
    lastUpdatedStamp: new Date().getTime(),
    get expirationStamp() {
        return this.lastUpdatedStamp + cachePeriod
    },
    courses: []
};

// console.log(cache.lastUpdatedStamp);
// console.log(cache.expirationStamp);

/**
 *
 * @param semester
 * @return {Promise<cheerio>}
 */
async function scrapeWebsiteFor(semester) {
    let text = cheerio();

    await fetch(baseURL)
        .then((res) => res.text())
        .then((body) => text = cheerio.load(body).text())
        .catch((err) => console.error(err));

    return text;
}

async function updateCache() {
    await scrapeWebsiteFor(0)
        .then(($) => {
            cache.courses = [];
        });
}

async function getClass(id) {
    console.log("Getting courses");

    // if cache has expired, reload cache
    if (Date.now() > cache.expirationStamp) {
        await scrapeWebsiteFor(0)
    }

    console.log("Cache is already up-to-date");
}

scrapeWebsiteFor(0);


module.exports = {
    getClass: getClass,
    getClassList: async () => {
        await updateCache();
        return Object.getOwnPropertyNames(cache);
    }
};
