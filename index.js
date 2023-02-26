require("dotenv").config();
const Axios = require("axios");
const Cheerio = require("cheerio");
const querystring = require("querystring");
const fse = require("fs-extra");

var DOMAIN = `https://truyentranhaudio.org`;
var SESSION_ID = ``;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const logOneLine = (text) => {
  process.stdout.moveCursor(0, -1); // up one line
  process.stdout.clearLine(1); // from cursor to end
  console.log(text);
};

const getValue = (html) => {
  const $ = Cheerio.load(html);

  const chapterId = $(".chapter-id").attr("data-id");
  let levelToken = "";
  const listScriptTags = $("script");

  for (let index = 0; index < listScriptTags.length; index++) {
    const element = $(listScriptTags[index]);
    let text = element.text();
    if (text.match(/levelToken/gi)) {
      const arr = text.trim().split("=");
      levelToken = arr[arr.length - 1].replace(/\"|;/gi, "").trim();
      break;
    }
  }

  return { chapterId, levelToken };
};

const getHtml = async (url) => {
  const requestInstance = Axios.create({
    baseURL: DOMAIN,
    headers: { Cookie: `PHPSESSID=${SESSION_ID};` },
  });
  return (await requestInstance.get(url)).data;
};

const makePoint = async (value) => {
  const requestInstance = Axios.create({
    baseURL: DOMAIN,
    headers: { Cookie: `PHPSESSID=${SESSION_ID};` },
  });
  const data = await requestInstance.post(`/app/manga/controllers/cont.updateLevel.php?type=chapter`, querystring.stringify(value));
  console.log(data.data.success ? "SUCCESS !" : "ERROR !");
};

/** */
(async () => {
  const data = JSON.parse(await fse.readFile("./data.json", "utf-8"));
  SESSION_ID = data.AUTH;
  DOMAIN = data.DOMAIN;

  for (let index = 1; index <= 3; index++) {
    const value = getValue(await getHtml(`${data.SLUG.replace(/^truyen/gi, "doc")}-chuong-${index}.html`));
    console.log(`Chapter: ${index}\n`);

    console.log("\nMaking...");
    await makePoint(value);
  }
})().then(() => process.exit(0));
