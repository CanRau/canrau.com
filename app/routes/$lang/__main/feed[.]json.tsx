/**
 * JSON Feed
 *
 * more at https://www.jsonfeed.org
 */
import type { Lang } from "/types";
import { json, type LoaderFunction } from "remix";
// note: stumbled upon `formatRFC3339` from `date-fns` on [SO](https://stackoverflow.com/a/68072900/3484824) more about [RFC3339](https://datatracker.ietf.org/doc/html/rfc3339)
import formatRFC3339 from "date-fns/formatRFC3339";
import { renderToString } from "react-dom/server";
import { getMDXComponent } from "mdx-bundler/client";
import { getPostsList, Frontmatter } from "~/utils/mdx.server";
import { notFoundError } from "~/utils/error-responses";
import { defaultLang, languages, rootUrl } from "/config";

export const loader: LoaderFunction = async ({ params }) => {
  const lang = (params.lang ?? defaultLang) as Lang;
  if (!languages.includes(lang)) {
    throw notFoundError();
  }
  // invariant(params.userId, "Expected params.userId");

  const posts = await getPostsList({ lang }).catch(() => {
    throw notFoundError(lang);
  });

  const items = posts
    .filter((post) => post.status === "published")
    .map((post) => {
      const feedNote: Record<Lang, string> = {
        en: `<div style="margin:1rem 0 2rem;"><div>NOTE:</div><div>This is the feed version of this article. For the full experience consider viewing it from your browser <a href="${post.canonical}">${post.canonical}</a></div></div>`,
        // de: `<div style="margin:1rem 0 2rem;"><div>INFO:</div><div>Das hier ist die Feed version des Artikels. Für die volle Experience öffne die Seite in deinem Browser <a href="${post.canonical}">${post.canonical}</a></div></div>`,
        // es: `<div style="margin:1rem 0 2rem;"><div>AVISO:</div><div>Esa es la version <a href="${post.canonical}">${post.canonical}</a></div></div>`,
      };
      const Comp = getMDXComponent(post.mdx);
      const content_html = `${feedNote[post.lang]}${renderToString(<Comp />)}`;
      return {
        id: post.canonical,
        url: post.canonical,
        title: post.title,
        summary: post.description,
        content_html,
        // content_text: post., // todo: add text version to json feed?
        image: post.cover,
        date_published: formatRFC3339(post.created),
        date_modified: formatRFC3339(post.updated || post.created),
        language: lang,
        // tags: ["tag1", "tag2"]
      };
    });

  const feed = {
    // https://json-schema.org/learn/getting-started-step-by-step.html
    // $schema: "https://json.schemastore.org/feed.json",
    version: "https://jsonfeed.org/version/1.1",
    title: "Can Rau's Digital Garden",
    home_page_url: rootUrl,
    feed_url: `${rootUrl}/${lang}/feed.json`,
    language: lang,
    // description: "",
    // user_comment: "", // (optional, string) is a description of the purpose of the feed. This is for the use of people looking at the raw JSON, and should be ignored by feed readers.
    // user_comment: "This is a microblog feed. You can add this to your feed reader using the following URL: https://example.org/feed.json",
    // icon: "", // (optional, string) is the URL of an image for the feed suitable to be used in a timeline, much the way an avatar might be used. It should be square and relatively large — such as 512 x 512 pixels — so that it can be scaled-down and so that it can look good on retina displays. It should use transparency where appropriate, since it may be rendered on a non-white background.
    // favicon: "", // (optional, string) is the URL of an image for the feed suitable to be used in a source list. It should be square and relatively small, but not smaller than 64 x 64 pixels (so that it can look good on retina displays). As with icon, this image should use transparency where appropriate, since it may be rendered on a non-white background.
    // icon: "", // 512px square or larger
    favicon: `${rootUrl}/favicon.ico`,
    authors: [
      {
        name: "Can Rau",
        url: rootUrl,
        avatar: "https://www.gravatar.com/avatar/3b4eb1b1e3184c6fdf1568eb5a6b71f0.jpg?s=512",
      },
    ],
    items,
  };

  return json(feed);
};
