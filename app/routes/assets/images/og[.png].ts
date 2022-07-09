// todo: design article cards with some "adorno" based on the categories og:image bg 🥳
import { redirect, type LoaderFunction } from "remix";
import matter from "gray-matter";
import { getContentPath, getFilePath } from "~/utils/compile-mdx.server";
// import { notFoundError } from "~/utils/error-responses";
import { readFile } from "~/utils.server";
import { revHash } from "~/utils";
import { domain, languages, defaultLang } from "/config";
import type { Lang } from "/types";
import { type Frontmatter } from "~/utils/mdx.server";
import {
  ogImageGenerator,
  defaultOgImageSize,
  supportedOgImageSizes,
  OG_IMAGE_VERSION,
  type Size,
} from "~/utils/ogImageGenerator.server";

// inspiration distribution in canvas http://jsfiddle.net/mes2L9vf/1/
export const loader: LoaderFunction = async ({ request }) => {
  const url = new URL(request.url);
  if (process.env.NODE_ENV === "production") {
    // force https in production for redirects to work properly
    url.protocol = "https:";
  }
  const slug = url.searchParams.get("slug") ?? "";
  const size = (url.searchParams.get("size") ?? "") as Size;
  const version = url.searchParams.get("v") ?? "";
  const rev = url.searchParams.get("rev") ?? "";
  const lang = (url.searchParams.get("lang") ?? "") as Lang;

  // if `slug` is missing we don't know what is requested so we stop right here and throw a 404
  // note: disabled version mismatch for now, not sure that's what caused Twitter Card Validator to fail tho 🤔
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
    // throw notFoundError(lang);
  }

  // if `version` doesn't match, redirect to current `OG_IMAGE_VERSION`
  if (parseInt(version, 10) !== OG_IMAGE_VERSION) {
    url.searchParams.set("v", `${OG_IMAGE_VERSION}`);
    return redirect(url.toString(), 302);
  }

  // if size isn't recognised, redirect to default
  if (!supportedOgImageSizes.includes(size)) {
    url.searchParams.set("size", `${defaultOgImageSize}`);
    return redirect(url.toString(), 302);
  }

  // if language isn't recognised, redirect to default
  if (!languages.includes(lang)) {
    url.searchParams.set("lang", `${defaultLang}`);
    return redirect(url.toString(), 302);
  }

  const filename = `${lang}.mdx`;
  const contentPath = getContentPath(slug);
  const filePath = getFilePath(contentPath, filename);
  const source = await readFile(filePath, { encoding: "utf-8" }).catch(() => {
    throw new Response("Not Found", { status: 404 });
    // throw notFoundError(lang);
  });

  // todo: probably too much clutter! (consider adding `description`, maybe only if less than n characters)
  // todo: `author` undefined
  // todo: maybe show `status` as well?
  const { data } = matter(source) as unknown as { data: Frontmatter };
  const { status, title, author } = data;
  const titleHash = revHash(title);

  if (rev.toLowerCase() !== titleHash.toLowerCase()) {
    url.searchParams.set("rev", `${titleHash}`);
    return redirect(url.toString(), 302);
  }

  const buffer = await ogImageGenerator({ title, slug, lang, size, status, author });

  const contentDisposition = process.env.NODE_ENV === "development" ? "inline" : "attachment";

  const headers: HeadersInit = {
    "Content-Type": "image/png",
    "Access-Control-Expose-Headers": "Content-Disposition",
    // can be `inline` or `attachment`
    "Content-Disposition": `${contentDisposition}; filename="${domain}_${slug}_${lang}_ogimage-${size}-v${OG_IMAGE_VERSION}.png"`,
    "x-content-type-options": "nosniff",
    // "Cache-Control": "public,max-age=31536000,immutable",
  };

  return new Response(buffer, { headers });
};
