const puppeteer = require('puppeteer');

class Crawler {
  constructor(settings) {
    this.browser;
    this.page;
    this.settings = {
      headless: true,
      placeA: '板橋車站',
      placeB: '台北車站',
      ...settings
    }
  }

  async _captureRequest(request) {
    const url = request.url();
    const whiteList = ['https://www.google.com.tw/maps/dir/', 'https://www.google.com.tw/maps/_/', 'https://www.google.com.tw/maps/preview/directions'];
    if (whiteList.some(e => url.startsWith(e))) {
      return request.continue();
    }
    request.abort('aborted');
  }

  async estimatedTime() {
    console.time('Process Time');
    const { headless, placeA, placeB } = this.settings;
    this.browser = await puppeteer.launch({ headless: headless });
    this.page = await this.browser.newPage();
    await this.page.setRequestInterception(true);
    this.page.on('request', this._captureRequest);
    await this.page.goto(`https://www.google.com.tw/maps/dir/${placeA}`);
    await this.page.waitForSelector('#directions-searchbox-1 input');
    await this.page.type('#directions-searchbox-1 input', placeB);
    await this.page.keyboard.press('Enter');
    const element = await this.page.waitForSelector('.section-directions-trip-duration');
    const time = await this.page.evaluate(element => element.innerText, element);
    await this.browser.close();
    console.timeEnd('Process Time');
    return time;
  }
}

(async () => {
  const settings = { placeA: '世新大學', placeB: '師大夜市', headless: false };
  const crawler = new Crawler(settings);
  const time = await crawler.estimatedTime();
  console.log(`從 '${crawler.settings.placeA}' 到 '${crawler.settings.placeB}', 預估時間: ${time}`);
})();