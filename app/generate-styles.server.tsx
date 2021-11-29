import fs from "fs/promises";
import { join } from "path";
import { Processor } from "windicss/lib";
import { HTMLParser } from "windicss/utils/parser";
import { hash } from "~/utils.server";

type IGenerateStyles = {
  url: URL;
  html: string;
  minify?: boolean;
};

const cssBasePath = join(process.cwd(), "app", "styles", "windicss");
// note: doesn't work with "params" demo!
const cssHashPath = join(process.cwd(), ".cache", "windicss-hashes.json");
const isIndex = (url: URL) => url.pathname === "/";
// const hashDb: Map<string, string> = new Map();

export async function generateStyles({
  url,
  html,
  minify = false,
}: IGenerateStyles) {
  const slugify = await import("@sindresorhus/slugify");
  const processor = new Processor();
  const htmlClasses = new HTMLParser(html)
    .parseClasses()
    .map((i) => i.result)
    .join(" ");

  const preflightSheet = processor.preflight(html);
  const interpretedSheet = processor.interpret(htmlClasses).styleSheet;

  const APPEND = false;
  const styles = interpretedSheet.extend(preflightSheet, APPEND).build(minify);
  const hashed = hash(styles);
  const cssFileName = isIndex(url) ? "index" : slugify.default(url.pathname);
  const cssPath = join(cssBasePath, `${cssFileName}.css`);

  try {
    const [hashFile, cssDir] = await Promise.all([
      fs.stat(cssHashPath),
      fs.stat(cssBasePath),
    ]);
    hashFile.isFile();
    cssDir.isDirectory();
    // (await fs.stat(cssHashPath)).isFile();
    // (await fs.stat(cssBasePath)).isDirectory();
  } catch (e) {
    await Promise.all([
      fs.writeFile(cssHashPath, "{}"),
      fs.mkdir(cssBasePath, { recursive: true }),
    ]);
  }

  const hashFile = JSON.parse(await fs.readFile(cssHashPath, "utf-8"));
  // console.log("\n\n", { cssFileName, hashed, hashFile }, "\n\n");
  // if (hashDb.get(cssFileName) === hashed) {
  if (hashFile[cssFileName] === hashed) {
    return;
  }

  hashFile[cssFileName] = hashed;
  // hashDb.set(cssFileName, hashed);
  await Promise.all([
    fs.writeFile(cssPath, styles),
    fs.writeFile(cssHashPath, JSON.stringify(hashFile)),
  ]);

  return;
}

// export async function generateStyles({
//   url,
//   html,
//   minify = false,
// }: IGenerateStyles) {
//   const slugify = await import("@sindresorhus/slugify");
//   // Get windi processor
//   const processor = new Processor();

//   // Parse all classes and put into one line to simplify operations
//   const htmlClasses = new HTMLParser(html)
//     .parseClasses()
//     .map((i) => i.result)
//     .join(" ");

//   // Generate preflight based on the html we input
//   // const preflightSheet = processor.preflight(html);

//   // Process the html classes to an interpreted style sheet
//   const interpretedSheet = processor.interpret(htmlClasses).styleSheet;

//   // Build styles
//   // const APPEND = false;
//   // const styles = interpretedSheet.extend(preflightSheet, APPEND).build(minify);
//   const styles = interpretedSheet.build(minify);
//   const hashed = hash(styles);
//   const cssFileName =
//     url.pathname === "/" ? "index" : slugify.default(url.pathname);

//   if (hashed === hashDb[cssFileName]) {
//     return;
//   }

//   const cssPath = join(
//     process.cwd(),
//     "app",
//     "styles",
//     "windicss",
//     `${cssFileName}.css`,
//   );

//   await fs.writeFile(cssPath, styles);

//   hashDb[cssFileName] = hashed;

//   return;
// }

// export async function generatePreflightStyles({
//   minify = false,
// }: {
//   minify: boolean;
// }) {
//   // Get windi processor
//   const processor = new Processor();

//   // Generate preflight based on the html we input
//   const preflightSheet = processor.preflight();
//   // Build styles
//   const styles = preflightSheet.build(minify);
//   const hashed = hash(styles);

//   if (hashed === hashDb.preflight) {
//     return;
//   }

//   const cssPath = join(
//     process.cwd(),
//     "app",
//     "styles",
//     "windicss",
//     "preflight.css",
//   );
//   await fs.writeFile(cssPath, styles);
//   hashDb.preflight = hashed;
// }
