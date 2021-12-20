import { type LoaderFunction } from "remix";
import formatDate from "date-fns/format";
import type { Lang } from "/types";
import { getPostsList } from "~/utils/mdx.server";
import { NotFoundError } from "~/utils/error-responses";
import { defaultLang, languages, rootUrl } from "/config";

export const loader: LoaderFunction = async ({ params, request }) => {
  const encoding = request.headers.get("accept-encoding") ?? "";
  const lang = (params.lang || defaultLang) as Lang;
  if (!languages.includes(lang)) {
    throw NotFoundError();
  }

  const posts = await getPostsList({ lang }).catch(() => {
    throw NotFoundError(lang);
  });

  const allPosts = posts.filter((post) => post.status === "published");

  const postItems = allPosts.map((post) => {
    return [
      `<url>`,
      `<loc>${post.canonical}</loc>`,
      `<lastmod>${formatDate(
        post.updated || post.created,
        "yyyy-MM-dd",
      )}</lastmod>`,
      `</url>`,
    ].join("");
  });

  const xml = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`,

    // index page, or /blog page
    `<url>`,
    `<loc>${rootUrl}/${lang}</loc>`,
    `<lastmod>${formatDate(
      allPosts[0].updated || allPosts[0].created,
      "yyyy-MM-dd",
    )}</lastmod>`,
    `</url>`,

    ...postItems,
    `</urlset>`,
  ];

  const headers: HeadersInit = {
    "Content-Type": "application/xml; charset=utf-8",
    "x-content-type-options": "nosniff",
  };

  return new Response(xml.join(""), { headers });
};
