import fs from "fs/promises";
import { join } from "path";
import slugify from "@sindresorhus/slugify";
import { Processor } from "windicss/lib";
import { HTMLParser } from "windicss/utils/parser";

type IGenerateStyles = {
  url: URL;
  html: string;
  minify?: boolean;
};

export async function generateStyles({
  url,
  html,
  minify = false,
}: IGenerateStyles) {
  // Get windi processor
  const processor = new Processor();

  // Parse all classes and put into one line to simplify operations
  const htmlClasses = new HTMLParser(html)
    .parseClasses()
    .map((i) => i.result)
    .join(" ");

  // Generate preflight based on the html we input
  // const preflightSheet = processor.preflight(html);

  // Process the html classes to an interpreted style sheet
  const interpretedSheet = processor.interpret(htmlClasses).styleSheet;

  // Build styles
  // const APPEND = false;
  // const styles = interpretedSheet.extend(preflightSheet, APPEND).build(minify);
  const styles = interpretedSheet.build(minify);

  const cssFileName = url.pathname === "/" ? "index" : slugify(url.pathname);
  const cssPath = join(
    process.cwd(),
    "app",
    "styles",
    "windicss",
    `${cssFileName}.css`,
  );
  await fs.writeFile(cssPath, styles);

  return styles;
}

export async function generatePreflightStyles({
  minify = false,
}: {
  minify: boolean;
}) {
  // Get windi processor
  const processor = new Processor();

  // Generate preflight based on the html we input
  const preflightSheet = processor.preflight();
  // Build styles
  const styles = preflightSheet.build(minify);

  const cssPath = join(
    process.cwd(),
    "app",
    "styles",
    "windicss",
    "preflight.css",
  );
  await fs.writeFile(cssPath, styles);
}
