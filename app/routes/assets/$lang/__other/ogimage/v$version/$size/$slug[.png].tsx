// todo: design article cards with some "adorno" based on the categories og:image bg 🥳
import { type LoaderFunction } from "remix";
import matter from "gray-matter";
import { getContentPath, getFilePath } from "~/utils/compile-mdx.server";
import { notFoundError } from "~/utils/error-responses";
import { readFile } from "~/utils.server";
import { defaultLang } from "/config";
import { Lang } from "/types";
import { type Frontmatter } from "~/utils/mdx.server";
import { ogImageGenerator, OG_IMAGE_VERSION, type Size } from "~/utils/ogImageGenerator";

// inspiration distribution in canvas http://jsfiddle.net/mes2L9vf/1/
export const loader: LoaderFunction = async ({ params }) => {
  const { slug, size, version } = params;
  const lang = (params.lang ?? defaultLang) as Lang;

  // if `slug` is missing or version doesn't match current `OG_IMAGE_VERSION` throw 404
  if (!slug || parseInt(version ?? "", 10) !== OG_IMAGE_VERSION) throw notFoundError(lang);

  const filename = `${lang}.mdx`;
  const contentPath = getContentPath(slug);
  const filePath = getFilePath(contentPath, filename);
  const source = await readFile(filePath, { encoding: "utf-8" }).catch(() => {
    throw notFoundError(lang);
  });

  // todo: probably too much clutter! (consider adding `description`, maybe only if less than n characters)
  // todo: `author` undefined
  // todo: maybe show `status` as well?
  const {
    data: { status, title, author },
  } = matter(source) as unknown as { data: Frontmatter };

  const buffer = await ogImageGenerator({ title, slug, lang, size: size as Size, status, author });

  const contentDisposition = process.env.NODE_ENV === "development" ? "inline" : "attachment";

  const headers: HeadersInit = {
    "Content-Type": "image/png",
    "Access-Control-Expose-Headers": "Content-Disposition",
    // can be `inline` or `attachment`
    "Content-Disposition": `${contentDisposition}; filename="canrau.com_${slug}_${lang}_ogimage-${size}-v${OG_IMAGE_VERSION}.png"`,
    "x-content-type-options": "nosniff",
    // fixme: proper cache settings!
    // "Cache-Control": "public,max-age=31536000,immutable",
  };

  return new Response(buffer, { headers });
};
