const Apify = require("apify");
const { product } = require("puppeteer");
const AllegroScraper = require("./allegro_scraper");
const SmartReviewDb = require("./mongo");

class PageHandler {
    constructor(requestQueue, dataset) {
        this.allegroScraper = new AllegroScraper();
        this.database = new SmartReviewDb();
        this.productsPseudoUrls = [new Apify.PseudoUrl(/https:\/\/allegro\.pl\/oferta\/(.)*/)];
        this.requestQueue = requestQueue;
        this.dataset = dataset;
    }

    async handlePage(request, page) {
        const { url } = request;
        await Apify.utils.enqueueLinks({
            page,
            selector: "a",
            pseudoUrls: this.productsPseudoUrls,
            requestQueue: this.requestQueue,
        });
        if (url.match(/https:\/\/allegro\.pl\/oferta\/(.)*/)) {
            const reviews = await this.allegroScraper.scrapeSinglePage(page);
            await this.dataset.pushData(reviews);
            console.log(reviews);
            //await this.database.addProductToDb("products", reviews);
        }
    }
}

Apify.main(async () => {
    const requestQueue = await Apify.openRequestQueue();
    //await requestQueue.addRequest({ url: "https://allegro.pl" });
    //await requestQueue.drop();
    const reviewsDataset = await Apify.openDataset("reviews");

    const pageHandler = new PageHandler(requestQueue, reviewsDataset);

    const crawler = new Apify.PuppeteerCrawler({
        requestQueue,
        handlePageFunction: async ({ request, page }) => pageHandler.handlePage(request, page),
        maxRequestsPerCrawl: 3130,
        maxConcurrency: 1,
        handlePageTimeoutSecs: 300
    });
    await crawler.run();
});
