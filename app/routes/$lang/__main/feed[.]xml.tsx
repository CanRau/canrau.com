import { type LoaderFunction } from "remix";
import zlib from "zlib";
import { promisify } from "util";
import formatDate from "date-fns/format";
import type { Lang } from "/types";
import { renderToString } from "react-dom/server";
import { getMDXComponent } from "mdx-bundler/client";
import { getPostsList } from "~/utils/mdx.server";
import { NotFoundError } from "~/utils/error-responses";
import { defaultLang, languages, rootUrl, domain } from "/config";

const isProd = process.env.NODE_ENV === "production";

// format according to RFC822
// example `Sun, 19 May 2002 15:21:36 GMT`
// const formatRFC822 = (date: Date) =>
//   // [format docs](https://date-fns.org/v2.27.0/docs/format)
//   // formatDate(date, "E, d MMM yyyy HH:mm:ss OOOO");
//   formatDate(date, "E, d MMM yyyy HH:mm:ss xx");

// done: make RSS feed dynamic
// note: RSS feed with [PrettyFeed](https://github.com/genmon/aboutfeeds/blob/main/tools/pretty-feed-v3.xsl) [inspired by](https://tomcritchlow.com/feed.xml)
// done: When RSS add Feedly subscribe link [example](https://feedly.com/i/subscription/feed/https://mindsers.blog/posts/rss/)
// note: [RSS Spec](https://validator.w3.org/feed/docs/rss2.html)
// done: turn prettyfeed into resource route to make languages and texts dynamic
// todo: [RSS3?](https://rss3.io)

/**
 * Get an RSS pubDate from a Javascript Date instance.
 * @param Date - optional
 * @return String
 *
 * from https://gist.github.com/samhernandez/5260558
 * more about [RFC822](https://datatracker.ietf.org/doc/html/rfc822)
 */
function pubDate(date: Date) {
  if (typeof date === "undefined") {
    date = new Date();
  }

  const pieces = date.toString().split(" ");
  const offsetTime = pieces?.[5]?.match(/[-+]\d{4}/);
  const offset = offsetTime ? offsetTime : pieces[5];
  const parts = [
    pieces[0] + ",",
    pieces[2],
    pieces[1],
    pieces[3],
    pieces[4],
    offset,
  ];

  return parts.join(" ");
}

export const loader: LoaderFunction = async ({ params, request }) => {
  const encoding = request.headers.get("accept-encoding") ?? "";
  const lang = (params.lang || defaultLang) as Lang;
  if (!languages.includes(lang)) {
    throw NotFoundError();
  }
  // invariant(params.userId, "Expected params.userId");

  const posts = await getPostsList({ lang }).catch(() => {
    throw NotFoundError(lang);
  });

  // from https://stackoverflow.com/a/57448862/3484824
  // const escapeHTML = (str: string) =>
  //   str.replace(
  //     /[&<>'"]/g,
  //     (tag) =>
  //       ({
  //         "&": "&amp;",
  //         "<": "&lt;",
  //         ">": "&gt;",
  //         "'": "&#39;",
  //         '"': "&quot;",
  //       }[tag]),
  //   );

  const postItems = posts
    .filter((post) => post.status === "published")
    // done: make `canonical` available from compile-mdx
    // <pubDate>Thu, 16 Dec 2021 01:13:00 +0000</pubDate>
    .map(
      (post) => {
        const feedNote: Record<Lang, string> = {
          en: `<div style="margin:1rem 0 2rem;"><div>NOTE:</div><div>This is the feed version of this article. For the full experience consider viewing it from your browser <a href="${post.canonical}">${post.canonical}</a></div></div>`,
          // de: `<div style="margin:1rem 0 2rem;"><div>INFO:</div><div>Das hier ist die Feed version des Artikels. Für die volle Experience öffne die Seite in deinem Browser <a href="${post.canonical}">${post.canonical}</a></div></div>`,
          // es: `<div style="margin:1rem 0 2rem;"><div>AVISO:</div><div>Esa es la version <a href="${post.canonical}">${post.canonical}</a></div></div>`,
        };
        const Comp = getMDXComponent(post.mdx);
        // encoding HTML https://cyber.harvard.edu/rss/encodingDescriptions.html
        const html = `${feedNote[post.lang]}${renderToString(<Comp />)}`;
        // <description><![CDATA[${await stripHtml(html)}]]></description>
        // <description><![CDATA[${html}]]></description>
        const tagDate = formatDate(post.created, "yyyy-MM-dd");
        return [
          `<item>`,
          `<title>${post.title}</title>`,
          `<pubDate>${pubDate(post.published || post.created)}</pubDate>`,
          `<description><![CDATA[${post.description}]]></description>`,
          `<content:encoded><![CDATA[${html}]]></content:encoded>`,
          `<link>${post.canonical}</link>`,
          // `<guid isPermaLink="true">${post.canonical}</guid>`,
          `<guid isPermaLink="false">tag:${domain},${tagDate}:${post.lang}${post.slug}</guid>`,
          `<dc:creator><![CDATA[${post.author}]]></dc:creator>`,
          `</item>`,
        ].join("");
      },
      // <category>Grateful Dead</category>
      // or
      // <category domain="http://www.fool.com/cusips">MSFT</category>
      // You may include as many category elements as you need to
    );

  const rss = [
    `<?xml version="1.0" encoding="UTF-8"?>`,
    // `<?xml-stylesheet href="/${lang}/pretty-feed-v3.xsl" type="text/xsl"?>`,
    // `<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:dc="http://purl.org/dc/elements/1.1/">`,
    `<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:content="http://purl.org/rss/1.0/modules/content/" xmlns:atom="http://www.w3.org/2005/Atom" xmlns:sy="http://purl.org/rss/1.0/modules/syndication/">`,
    `<channel>`,
    `<title>CanRau.com</title>`,
    `<description>Can Rau's Digital Garden</description>`,
    `<link>${rootUrl}/${lang}</link>`,
    `<atom:link href="${rootUrl}/${lang}/feed.xml" rel="self" type="application/rss+xml" />`,
    `<language>${lang}</language>`,
    `<docs>https://cyber.harvard.edu/rss/rss.html</docs>`, // A URL that points to the documentation for the format used in the RSS file. It's probably a pointer to this page. It's for people who might stumble across an RSS file on a Web server 25 years from now and wonder what it is.
    `<sy:updatePeriod>daily</sy:updatePeriod>`,
    // or `<docs>https://validator.w3.org/feed/docs/rss2.html</docs>`,
    // `<image>${lang}</image>`, // Specifies a GIF, JPEG or PNG image that can be displayed with the channel. More info here.
    // `<lastBuildDate>Sat, 07 Sep 2002 9:42:31 GMT</lastBuildDate>`, // The last time the content of the channel changed.
    // `<category>Newspapers</category>`, // Specify one or more categories that the channel belongs to
    ...postItems,
    `</channel>`,
    `</rss>`,
  ];

  let returnData: string | Buffer = rss.join("");
  const headers: HeadersInit = {
    // "Content-Type": "text/xml; charset=utf-8",
    "Content-Type": "application/xml; charset=utf-8",
    "x-content-type-options": "nosniff",
  };

  // note: compression inspired by [Node v12.7 How to implement native brotli, gzip, deflate compression buffer](https://stackoverflow.com/a/57436159/3484824)
  // if (isProd) {
  //   if (encoding.includes("br")) {
  //     const brotli = promisify(zlib.brotliCompress);
  //     const dataBuffer = Buffer.from(rss.join(""), "utf-8");
  //     returnData = await brotli(dataBuffer);
  //     headers["Content-Encoding"] = "br";
  //     headers["Content-Length"] = `${dataBuffer.length}`;
  //   } else if (encoding.includes("gzip")) {
  //     const gzip = promisify(zlib.gzip);
  //     const dataBuffer = Buffer.from(rss.join(""), "utf-8");
  //     returnData = await gzip(dataBuffer);
  //     headers["Content-Encoding"] = "gzip";
  //     headers["Content-Length"] = `${dataBuffer.length}`;
  //   } else if (encoding.includes("deflate")) {
  //     const deflate = promisify(zlib.deflate);
  //     const dataBuffer = Buffer.from(rss.join(""), "utf-8");
  //     returnData = await deflate(dataBuffer);
  //     headers["Content-Encoding"] = "deflate";
  //     headers["Content-Length"] = `${dataBuffer.length}`;
  //   }
  // }

  return new Response(returnData, { headers });
};
