import { mkdir, readFile, writeFile } from "fs/promises";
import { json, type LoaderFunction } from "remix";
// import puppeteer from "puppeteer";
// import sharp from "sharp";
import { defaultLang, isContainer } from "/config";
import { Lang } from "/types";
import { join } from "path";

const sizes: Record<string, number> = {
  small: 504,
};

const defaultViewport = {
  height: 1200,
  width: 630,
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const { slug } = params;
  if (!slug) return null;
  const lang = (params.lang || defaultLang) as Lang;
  const url = new URL(request.url);
  const querySize = url.searchParams.get("size");
  const size = querySize ? sizes[querySize] : "";
  const sizeSuffix = size ? `_${querySize}` : "";
  const postPath = join(process.cwd(), "content", slug);
  const imagePath = `${postPath}/ogimage${sizeSuffix}.png`;
  const headers: HeadersInit = {
    "Content-Type": "image/png",
    // can be `inline` or `attachment`
    "Content-Disposition": `inline; filename="${slug}_ogimage${sizeSuffix}.png"`,
    "x-content-type-options": "nosniff",
  };
  const cachedImage = await readFile(imagePath).catch(() => {});
  if (!cachedImage) {
    console.log(`MISSING OG:IMAGE for "/${lang}/${slug}"`);
    throw json({ lang, error: "missing image" }, 500);
  }
  return new Response(cachedImage, { headers });
  // const launchBrowser = puppeteer.launch({
  //   // note(Puppeteer): [--disable-dev-shm-usage](https://github.com/puppeteer/puppeteer/blob/main/docs/troubleshooting.md#tips)
  //   // note(Puppeteer): --no-sandbox as mentionded on [SO](https://stackoverflow.com/a/59154049/3484824)
  //   args: [
  //     "--font-render-hinting=none", // from https://docs.browserless.io/blog/2020/09/30/puppeteer-print.html#use-a-special-launch-flag
  //     "--disable-dev-shm-usage",
  //     "--no-sandbox",
  //     "--disable-setuid-sandbox",
  //   ],
  //   userDataDir: pptrCache,
  //   ...(isContainer && { executablePath: "google-chrome-stable" }),
  // });
  // const browser = await launchBrowser;
  // const page = await browser.newPage();
  // // from https://docs.browserless.io/blog/2020/09/30/puppeteer-print.html#set-a-standard-user-agent-header
  // await page.setUserAgent(
  //   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_6) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/85.0.4183.121 Safari/537.36",
  // );
  // const templateUrl = request.url.replace(".png", "/template");

  // // await page.evaluate(() => (document.body.style.background = "transparent"));
  // // setViewport via [Peter Tran](https://petertran.com.au/2018/07/12/blank-images-puppeteer-screenshots-solved/)
  // // await page.setViewport(defaultViewport); // not needed at the moment
  // await page.goto(templateUrl);
  // const element = await page.$("#ogimage");
  // if (!element) {
  //   console.error("Could'nt get #ogimage");
  //   throw json({ lang, error: "Error creating the image" }, 500);
  // }
  // const boundingBox = await element.boundingBox();
  // if (!boundingBox) {
  //   console.error("Could'nt get element.boundingBox");
  //   throw json({ lang, error: "Error creating the image" }, 500);
  // }
  // let screenshot = await page?.screenshot({
  //   omitBackground: true,
  //   type: "png",
  //   // done: screenshot ended up being cut-off without clip 😳
  //   clip: { ...boundingBox, height: boundingBox.height },
  // });
  // await element.dispose();
  // await browser.close();

  // if (size) {
  //   // twitter rendered in browser w504px X h263.867px
  //   screenshot = await sharp(screenshot)
  //     .resize(size)
  //     .toBuffer()
  //     .catch((e) => {
  //       console.error(e);
  //       throw json({ lang, error: "Error creating the image" }, 500);
  //     });
  // }

  // if (typeof screenshot === "undefined") {
  //   throw json({ lang, error: "Error creating the image" }, 500);
  // }

  // // note: would be cool if we could `Response` without returning so we could cache after sending the response to the browser
  // await writeFile(imagePath, screenshot);

  // return new Response(screenshot, { headers });
};
