import { mkdir, readFile, writeFile } from "fs/promises";
import { json, type LoaderFunction } from "remix";
import puppeteer from "puppeteer";
import sharp from "sharp";
import { defaultLang } from "/config";
import { Lang } from "/types";

const sizes: Record<string, number> = {
  small: 504,
};

export const loader: LoaderFunction = async ({ request, params }) => {
  const { slug } = params;
  const lang = (params.lang || defaultLang) as Lang;
  const url = new URL(request.url);
  const querySize = url.searchParams.get("size");
  const size = querySize ? sizes[querySize] : "";
  const headers: HeadersInit = {
    "Content-Type": "image/png",
    // can be `inline` or `attachment`
    "Content-Disposition": `inline; filename="${slug}_ogimage.png"`,
    "x-content-type-options": "nosniff",
  };
  const imagePath = `.cache/ogimages/${slug}_ogimage${
    size ? `-${querySize}` : ""
  }.png`;
  const cachedImage = await readFile(imagePath).catch(() => {});
  if (cachedImage) {
    return new Response(cachedImage, { headers });
  }
  const ensureCacheDir = mkdir(".cache/ogimages").catch(() => {});
  const templateUrl = request.url.replace(".png", "/template");
  const [browser] = await Promise.all([puppeteer.launch(), ensureCacheDir]);
  const page = await browser.newPage();
  await page.goto(templateUrl);

  // await page.evaluate(() => (document.body.style.background = "transparent"));
  const element = await page.$("#ogimage");
  let screenshot = await element?.screenshot({
    omitBackground: true,
    // path: imagePath,
    type: "png",
  });
  await browser.close();

  if (size) {
    // twitter rendered in browser w504px X h263.867px
    screenshot = await sharp(screenshot)
      .resize(size)
      .toBuffer()
      .catch((e) => {
        console.error(e);
        throw json({ lang, error: "Error creating the image" }, 500);
      });
  }

  if (typeof screenshot === "undefined") {
    throw json({ lang, error: "Error creating the image" }, 500);
  }

  // note: would be cool if we could `Response` without returning so we could `writeFile` after sending the response to the browser
  await writeFile(imagePath, screenshot);

  return new Response(screenshot, { headers });
};
