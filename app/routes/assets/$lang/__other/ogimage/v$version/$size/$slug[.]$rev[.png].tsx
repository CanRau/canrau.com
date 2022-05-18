// todo: design article cards with some "adorno" based on the categories og:image bg 🥳
import { redirect, type LoaderFunction } from "remix";
import matter from "gray-matter";
import { getContentPath, getFilePath } from "~/utils/compile-mdx.server";
// import { notFoundError } from "~/utils/error-responses";
import { readFile, revHash } from "~/utils.server";
import { languages, defaultLang } from "/config";
import type { Lang } from "/types";
import { type Frontmatter } from "~/utils/mdx.server";
import {
  ogImageGenerator,
  defaultOgImageSize,
  supportedOgImageSizes,
  OG_IMAGE_VERSION,
  type Size,
} from "~/utils/ogImageGenerator";

type LoaderFunc<Params extends Record<string, unknown> = Record<string, unknown>> = (
  args: Omit<Parameters<LoaderFunction>["0"], "params"> & { params: Params },
) => ReturnType<LoaderFunction>;

type Ctx = {
  slug: string;
  size: Size;
  version: string;
  rev: string;
  lang: Lang;
};

// inspiration distribution in canvas http://jsfiddle.net/mes2L9vf/1/
export const loader: LoaderFunc<Ctx> = async ({ params, request }) => {
  const { slug, size, version, rev, lang } = params;

  // if `slug` is missing we don't know what is requested so the stop right here and throw a 404
  // note: disabled version mismatch for now, not sure that's what caused Twitter Card Validator to fail tho 🤔
  if (!slug) {
    throw new Response("Not Found", { status: 404 });
    // throw notFoundError(lang);
  }

  // if `version` doesn't match, redirect to current `OG_IMAGE_VERSION`
  if (parseInt(version, 10) !== OG_IMAGE_VERSION) {
    const url = new URL(request.url);
    url.pathname = `/assets/${lang}/ogimage/v${OG_IMAGE_VERSION}/${size}/${slug}.${rev}.png`;
    return redirect(url.toString(), 302);
  }

  // if size isn't recognised, redirect to default
  if (!supportedOgImageSizes.includes(size)) {
    const url = new URL(request.url);
    url.pathname = `/assets/${lang}/ogimage/v${OG_IMAGE_VERSION}/${defaultOgImageSize}/${slug}.${rev}.png`;
    return redirect(url.toString(), 302);
  }

  // if language isn't recognised, redirect to default
  if (!languages.includes(lang)) {
    const url = new URL(request.url);
    url.pathname = `/assets/${defaultLang}/ogimage/v${OG_IMAGE_VERSION}/${size}/${slug}.${rev}.png`;
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

  // fixme: do we want to redirect to the current title instead? I guess so!
  if (rev.toLowerCase() !== revHash(title).toLowerCase()) {
    throw new Response("Not Found", { status: 404 });
    // throw notFoundError(lang);
  }

  const buffer = await ogImageGenerator({ title, slug, lang, size, status, author });

  const contentDisposition = process.env.NODE_ENV === "development" ? "inline" : "attachment";

  const headers: HeadersInit = {
    "Content-Type": "image/png",
    "Access-Control-Expose-Headers": "Content-Disposition",
    // can be `inline` or `attachment`
    "Content-Disposition": `${contentDisposition}; filename="canrau.com_${slug}_${lang}_ogimage-${size}-v${OG_IMAGE_VERSION}.png"`,
    "x-content-type-options": "nosniff",
    // "Cache-Control": "public,max-age=31536000,immutable",
  };

  return new Response(buffer, { headers });
};
