// todo: design article cards with some "adorno" based on the categories og:image bg 🥳
import { type LoaderFunction } from "remix";
import matter from "gray-matter";
import { getContentPath, getFilePath } from "~/utils/compile-mdx.server";
import { notFoundError } from "~/utils/error-responses";
import { readFile } from "~/utils.server";
import { defaultLang } from "/config";
import { Lang } from "/types";
import { type Frontmatter } from "~/utils/mdx.server";
import { ogImageGenerator, type Size } from "~/utils/ogImageGenerator";

// inspiration distribution in canvas http://jsfiddle.net/mes2L9vf/1/
export const loader: LoaderFunction = async ({ params }) => {
  // fix: reconsider the version param for proper cache invalidation
  const { slug, size } = params;
  if (!slug) return null;

  const lang = (params.lang ?? defaultLang) as Lang;
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

  const headers: HeadersInit = {
    "Content-Type": "image/png",
    "Access-Control-Expose-Headers": "Content-Disposition",
    // can be `inline` or `attachment`
    "Content-Disposition": `attachment; filename="canrau.com_${slug}_ogimage-${size}.png"`,
    "x-content-type-options": "nosniff",
    // fixme: proper cache settings!
    "Cache-Control": "max-age=0",
  };

  return new Response(buffer, { headers });
};
