const { readdir, readFile, writeFile } = require("fs").promises;
const puppeteer = require("puppeteer");
const sharp = require("sharp");
const [_, __, cmd, ...postPaths] = process.argv;

let cachedBrowser;

if (cmd === "all") {
  console.log("taking all screenshots");
  readdir("./content")
    .then(takeScreenshotOfFiles)
    .then(() => console.log("done"));
} else if (cmd === "pre-commit") {
  const contentPaths = postPaths.filter((p) => p.includes("content"));
  if (contentPaths.length === 0) {
    process.exit();
  }
  console.log("take pre-commit screenshots of", contentPaths.join(", "));
  const files = contentPaths.map((p) => p.replace("content/", "").replace("/en.mdx", ""));
  takeScreenshotOfFiles(files).then(() => console.log("done"));
} else if (cmd === "single") {
  console.log(`taking screenshot of ${postPaths[0]}`);
  takeScreenshot(postPaths[0]).then(async () => {
    console.log(`took screenshot of ${postPaths[0]}`);
    if (cachedBrowser) {
      console.log("closing browser instance");
      await cachedBrowser.close();
    }
  });
}

async function takeScreenshotOfFiles(files) {
  for (const file of files) {
    console.log(`taking screenshot of ${file}`);
    await takeScreenshot(file);
    console.log(`took screenshot of ${file}`);
  }
  if (cachedBrowser) {
    console.log("closing browser instance");
    await cachedBrowser.close();
  }
}

async function getBrowser() {
  console.log("launching browser");
  return puppeteer.launch({
    // headless: false,
    // slowMo: 750,
    executablePath: "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
  });
}

async function takeScreenshot(slug) {
  const browser = cachedBrowser || (await getBrowser());
  cachedBrowser = browser;
  const template = `http://localhost:3000/en/ogimage/${slug}/template`;
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/44.0.2403.157 Safari/537.36",
  );
  await page.goto(template, { waitUntil: "networkidle0" });
  // await page.goto(url, { waitUntil: 'load' });
  // await page.goto(url, { waitUntil: 'domcontentloaded' });
  // await page.goto(url, { waitUntil: 'networkidle0' });
  // await page.goto(url, { waitUntil: 'networkidle2' });

  const element = await page.$("#ogimage");
  if (!element) {
    console.error("Could'nt get #ogimage");
    process.exit();
  }

  const boundingBox = await element.boundingBox();
  if (!boundingBox) {
    console.error("Could'nt get element.boundingBox");
    process.exit();
  }

  const path = `./content/${slug}/ogimage.png`;
  await element?.screenshot({
    omitBackground: true,
    type: "png",
    path,
  });

  await sharp(path)
    .resize(504)
    .toFile(path.replace(".png", "_small.png"))
    .catch((e) => {
      console.error(e);
      throw json({ lang, error: "Error creating the image" }, 500);
    });

  await element.dispose();
  await page.close();
}
