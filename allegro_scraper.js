const puppeteer = require("puppeteer");

const productNameSelector2 = "h1._9a071_1Ux3M._9a071_3nB--._9a071_1R3g4._9a071_1S3No";
const productNameSelector1 = "div._1h7wt._15mod > h1._1s2v1._1djie._4lbi0";
const imgUrlSelector = "div._b8e15_gVe8x._b8e15_Hb8E4 > img";
const loadReviewsButtonSelector = "div > button.mgn2_14.mp0t_0a.m9qz_yo.mp7g_oh.mse2_40.mqu1_40.mtsp_ib.mli8_k4.mp4t_0.m3h2_0.mryx_0.munh_0.m911_5r.mefy_5r.mnyp_5r.mdwl_5r.msbw_2.mldj_2.mtag_2.mm2b_2.mqvr_2.msa3_z4.mqen_m6.meqh_en.m0qj_5r.msts_n7.mh36_16.mvrt_16.mg9e_0.mj7a_0.m9tr_pf.m2ha_2.m8qd_qh.mjt1_n2.bqyr8.mgmw_vz.mrmn_qo.mrhf_u8.m31c_kb.m0ux_fp.boww4.m7er_k4._6a940_3i0Bo";
const singleReviewSelector = "div > div > div[itemprop='review'] > div._1yyhi";

class AllegroScrapper {
    async scrapeSinglePage(page) {
        this.page = page;
        let url = this.page.url();
        const name = await this.getProductName();
        await this.page.goto(url.concat("#productReviews"));
        await this.loadAllReviews(loadReviewsButtonSelector);
        let reviews = await this.getReviews(singleReviewSelector);
        const data = new Date();
        reviews = await this.addUrlAndDataToReviews(data, url, reviews);
        url = [url];
        const imgUrl = await this.getImgUrl();
        return {
            name,
            imgUrl,
            url,
            reviews
        };
    }

    async loadAllReviews(selector) {
        let isButtonVisible = await this.isElementVisible(selector);
        while (isButtonVisible) {
            await this.page.waitForSelector(selector);
            await this.page
                .click(selector)
                .catch((e) => {
                    console.log(e);
                });
            await new Promise(r => setTimeout(r, 500));
            isButtonVisible = await this.isElementVisible(selector);
        }
    }

    async isElementVisible(selector) {
        let visible = true;
        await this.page
            .waitForSelector(selector, 
                                { visible: true, timeout: 2000 })
            .catch(() => {
                visible = false;
            });
        return visible;
    }

    async getProductName() {
        let name = await this.getProductNameBySelector(productNameSelector1);
        if (name === "") {
            name = await this.getProductNameBySelector(productNameSelector2);
        }
        return name;
    }

    async getProductNameBySelector(selector) {
        try { 
            return await this.page.$eval(selector, 
                                            (productName) => productName.innerText);
        } catch (e) {
            console.log("error while gathering product name");
            console.log(e);
            return "";
        }
    }

    async getImgUrl() {
        return await this.page.$eval(imgUrlSelector, image => image.src);
    }

    async destruct() {
        await this.browser.close();
    }

    async getReviews(selector) {
        try {
            await this.page.waitForSelector("div.main-wrapper", { timeout: 3000 });
            return await this.page.$$eval(
                selector,
                this.constructor.extractReviews,
            );
        } catch (e) {
            if (e instanceof puppeteer.errors.TimeoutError) {
                console.log("Selector not found.");
            }
            return [];
        }
    }

    static extractReviews(nodes) {
        return nodes.map((node) => {
            const text = node.querySelector("div.mp4t_8.mryx_16.mryx_0_l.myre_zn._3kk7b._vnd3k._1plx6").innerText;
            const rate = parseInt(node.querySelector("div._3kk7b._vnd3k.m389_6m.mqu1_16 > span[itemprop='reviewRating'] > meta").getAttribute('content'));
            const maxRate = 5;
            const dataMessage = node.querySelector("div._3kk7b._vnd3k.m389_6m.mqu1_16 > span.mgn2_12.mqu1_16.mgmw_ag.munh_8 > span").innerText;
            return {
                text,
                rate,
                maxRate,
                dataMessage
            };
        });
    }

    async addUrlAndDataToReviews(data, url, reviews) {
        for (var k in reviews) {
            reviews[k].url = url;
            reviews[k].scrappedAt = data;
        }
        return reviews;
    }
}

module.exports = AllegroScrapper;