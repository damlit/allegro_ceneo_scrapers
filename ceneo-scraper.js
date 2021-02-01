const puppeteer = require("puppeteer");

class CeneoScraper {
    async scrapeSinglePage(page) {
        this.page = page;
        let url = page.url();
        let reviews = await this.getReviews();
        const name = await this.getProductName();
        const imgUrl = await this.getImgUrl();
        // eslint-disable-next-line no-await-in-loop
        while (await this.goToNextPage()) {
            // eslint-disable-next-line no-await-in-loop
            reviews.concat(await this.getReviews());
        }

        const data = new Date();
        reviews = await this.addUrlAndDataToReviews(data, url, reviews);
        url = [url];
        return {
            name,
            imgUrl,
            url,
            reviews
        };
    }

    async getProductName() {
        try {
            return await this.page.$eval("h1.product-top-2020__product-info__name", (productName) => productName.innerText);
        } catch (e) {
            console.log("error while gathering product name");
            console.log(e);
            return "";
        }
    }

    async getImgUrl() {
        try {
            return await this.page.$eval("a.js_gallery-anchor.js_image-preview > img", (image) => image.src);
        } catch (e) {
            console.log("error while gathering image url.");
            console.log(e);
            return "";
        }
    }

    async goToNextPage() {
        try {
            const newPage = await this.page.$eval("a.pagination__item.pagination__next", (page) => page.href);
            await this.page.goto(newPage);
            return newPage;
        } catch (e) {
            console.log("It hasn't have more pages.");
            return null;
        }
    }

    async destruct() {
        await this.browser.close();
    }

    async getReviews() {
        try {
            await this.page.waitForSelector("div.js_product-review", { timeout: 1000 });
            return await this.page.$$eval(
                "div.js_product-review > .user-post__body > .user-post__content",
                this.constructor.extractReviews,
            );
        } catch (e) {
            if (e instanceof puppeteer.errors.TimeoutError) {
                console.log("Selector not found.");
            }
            return [];
        }
    }

    async addUrlAndDataToReviews(data, url, reviews) {
        for (var k in reviews) {
            reviews[k].url = url;
            reviews[k].scrappedAt = data;
        }
        return reviews;
    }

    // eslint-disable-next-line class-methods-use-this
    static extractReviews(nodes) {
        return nodes.map((node) => {
            const text = node.querySelector(".user-post__text").innerText;
            const rate = node.querySelector("span[class='user-post__score-count']").innerText;
            const rateWithoutMaxRate = parseFloat(rate.substring(0, rate.indexOf("/")));
            const dataMessage = node.querySelector("span[class='user-post__published'] > time").innerText;
            return {
                text,
                rate: rateWithoutMaxRate,
                maxRate: 5,
                dataMessage,
            };
        });
    }
}

module.exports = CeneoScraper;
