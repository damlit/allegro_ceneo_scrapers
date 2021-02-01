const { ObjectID } = require("mongodb");
const puppeteer = require("puppeteer");
const AllegroScraper = require("./allegro_scraper");
const CeneoScrapper = require("./ceneo-scraper");
const SmartReviewDb = require("./mongo");

class QueueService {
    constructor() {
        this.allegroScraper = new AllegroScraper();
        this.ceneoScrapper = new CeneoScrapper();
        this.database = new SmartReviewDb();
    }

    async scrapPage(pageToScrap, browser) {
        const urlToScrap = pageToScrap.payload.url;
        const page = await browser.newPage();
        await page.goto(urlToScrap);

        if (urlToScrap.match(/https:\/\/allegro\.pl\/oferta\/(.)*/)) {
            const reviews = await this.allegroScraper.scrapeSinglePage(page);
            await this.database.addProductToDb("products", reviews);
            let id = new ObjectID(pageToScrap._id);
            await this.database.deleteFromBaseById("productQueue", id);
        } else if (urlToScrap.match(/https:\/\/www.ceneo.pl\/\d+$/)) {
            const reviews = await this.ceneoScrapper.scrapeSinglePage(page);
            await this.database.addProductToDb("products", reviews);
            let id = new ObjectID(pageToScrap._id);
            await this.database.deleteFromBaseById("productQueue", id);
        }
        await page.close();
    }
    
    async startBrowser(){
        let browser;
        try {
            console.log("Opening the browser......");
            browser = await puppeteer.launch({
                headless: false,
                args: ["--disable-setuid-sandbox"],
                'ignoreHTTPSErrors': true
            });
        } catch (err) {
            console.log("Could not create a browser instance => : ", err);
        }
        return browser;
    }
}

(async () => {
    const queueService = new QueueService();
    const browser = await queueService.startBrowser();

    while (1) {
        await queueService.database.printCollectionCount("productQueue");
        try{
            const pageToScrap = await queueService.database.getFirstObjectFromQueue();
            if (pageToScrap !== null && typeof pageToScrap !== "undefined") {
                await queueService.scrapPage(pageToScrap, browser);
            } else {
                const delay = ms => new Promise(res => setTimeout(res, ms));
                console.log('ProductQueue is empty. Next check will be after 5s.')
                await delay(5000);
            }
        } catch (err) {
            console.log(err);
        }
    }
})();