import {
  type MetaFunction,
  type LoaderFunction,
  type LinksFunction,
  type RouteHandle,
  json,
  useLoaderData,
} from "remix";
import { createElement, useMemo, type FC } from "react";
import TwitterShareButton from "react-share/lib/TwitterShareButton";
import RedditShareButton from "react-share/lib/RedditShareButton";
import parseISO from "date-fns/parseISO";
import formatDate from "date-fns/format";
import { readFile } from "~/utils.server";
// import { bundleMDX } from "mdx-bundler";
import { getMDXComponent, getMDXExport } from "mdx-bundler/client";
import {
  bundleMDX,
  getContentPath,
  getFilePath,
} from "~/utils/compile-mdx.server";
import { loader as getTotalPathVisitsLoader } from "~/utils/get-total-path-visits";
import * as typography from "~/components/typography";
import { Link } from "~/components/link";
import prismPlus from "~/styles/prism-plus.css";
import prismTheme from "~/styles/prism-theme.css";
import {
  rootUrl,
  domain,
  titleSeperator,
  twitterHandle,
  twitterId,
} from "/config";
import type { Lang } from "/types";
import { NotFoundError } from "~/utils/error-responses";
import { Frontmatter } from "~/utils/mdx.server";
// import type { TocEntry } from "@stefanprobst/rehype-extract-toc";

const isProd = process.env.NODE_ENV === "production";

export const meta: MetaFunction = ({ data }) => {
  const {
    title: _title,
    description: _description,
    lang,
    slug,
    cover,
  } = data?.frontmatter ?? {};
  const title = `${_title || "Missing Title"}${titleSeperator}${domain}`;
  const url = `${rootUrl}/${lang}${slug}`;
  const description = _description || "Missing description";
  const image = `${rootUrl}${cover}`;
  // todo: make reusable function to define meta-tags
  return {
    title,
    description,
    "og:url": url,
    "og:title": title,
    "og:description": description,
    "og:image": image, // note: clear FB cache [Sharing Debugger](https://developers.facebook.com/tools/debug/)
    "twitter:card": cover ? "summary_large_image" : "summary",
    "twitter:creator": twitterHandle,
    "twitter:site": twitterHandle,
    // "twitter:title": title,
    // "twitter:description": description,
    // "twitter:image": image, // note: validate [Twitter Cards](https://cards-dev.twitter.com/validator/)
    "twitter:alt": title, // note: more about [Twitter Cards](https://developer.twitter.com/en/docs/twitter-for-websites/cards/guides/getting-started)
  };
};

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: prismPlus },
    { rel: "stylesheet", href: prismTheme },
  ];
};

type LoaderData = {
  frontmatter: Frontmatter;
  code: string;
  canonical: string;
  totalPathVisits: number;
};

// export const handle: RouteHandle = {
//   canonical: (pathname: string) => pathname,
// };

export const handle: RouteHandle = {
  hydrate: ({ frontmatter }: LoaderData) => frontmatter?.hydrate,
};

// https://remix.run/api/conventions#loader
export const loader: LoaderFunction = async ({ params, request }) => {
  // console.log({ params });
  const lang = (params.lang || "en") as Lang;
  const slug = params.slug || "index";
  const filename = `${lang}.mdx`;
  const contentPath = getContentPath(slug);
  const filePath = getFilePath(contentPath, filename);
  const source = await readFile(filePath, { encoding: "utf-8" });
  const bundleMdxPromise = bundleMDX({ cwd: contentPath, source }).catch(() => {
    throw NotFoundError(lang);
  });

  const [
    {
      frontmatter, // : { jsonld, ...frontmatter },
      code,
    },
    totalPathVisits,
  ] = await Promise.all([
    bundleMdxPromise,
    getTotalPathVisitsLoader({ request }),
  ]);

  if (isProd && frontmatter.status !== "published") {
    throw NotFoundError(lang);
  }

  // todo: wait for [kentcdodds/mdx-bundler#70](https://github.com/kentcdodds/mdx-bundler/issues/70)
  const { jsonld } = getMDXExport(code);

  const canonical =
    frontmatter.canonical ||
    `${rootUrl}/${frontmatter?.lang}${frontmatter?.slug}`;
  return json({ frontmatter, code, canonical, totalPathVisits, jsonld });
};

const headingWithClasses =
  (comp: FC | string, className: string) => (props: any) =>
    createElement(comp, { ...props, className });

// note: more on [component substitution](https://github.com/wooorm/xdm#components)
const components = {
  // h1: typography.H1,
  // or use typography.H2, looks also good: dark:decoration-green-900
  h2: headingWithClasses("h2", "decoration-skin-accent target:underline"),
  h3: headingWithClasses("h3", "decoration-skin-accent target:underline"),
  h4: headingWithClasses("h4", "decoration-skin-accent target:underline"),
  h5: headingWithClasses("h5", "decoration-skin-accent target:underline"),
  h6: headingWithClasses("h6", "decoration-skin-accent target:underline"),
  a: Link,
  Link,
  // p: typography.Paragraph,
};

// const components = Array(5)
//   .fill({})
//   .reduce((element, obj, index) => {
//     const level = index + 2; // to start at h2
//     obj[`h${level}`] = headingWithClasses(
//       `h${level}`,
//       "decoration-skin-accent target:underline",
//     );
//     return obj;
//   }, {});

type IGetH1 = {
  published: string;
  updated: string;
  created: string;
};
const GetH1 =
  ({ published, updated, created }: IGetH1) =>
  (props: any) => {
    // note: why is parseISO necessary?? - switched to dates being string anyway 🤷🏻‍♂️
    // console.log({ created, published, updated }, typeof updated);
    // note: [schema.org/Date](https://schema.org/Date)
    return (
      <>
        <typography.H1 {...props} />
        <div className="flex space-x-4 text-sm text-zinc-400 mb-10">
          {updated && (
            <div>
              Last updated:&nbsp;
              <time
                className="ml-1"
                // dateTime={updated} property="dateModified"
              >
                {formatDate(parseISO(updated), "yyyy-MM-dd")}
              </time>
            </div>
          )}
          {published && (
            <div>
              Published:&nbsp;
              <time
                className="ml-1"
                // dateTime={published || created} property="datePublished"
              >
                {formatDate(parseISO(published), "yyyy-MM-dd")}
              </time>
            </div>
          )}
        </div>
      </>
    );
  };

export default function Post() {
  const { code, frontmatter, totalPathVisits } = useLoaderData<LoaderData>();
  const Component = useMemo(() => getMDXComponent(code), [code]);
  // todo: Add "banner" if page not yet published
  return (
    <>
      {/* todo: mark external links somewhow `prose-a:after:content-['_↗']` (from TW docs) is interesting but might be a little much? */}
      <div className="space-y-20">
        <main className="prose prose-lg lg:prose-xl dark:prose-invert mx-auto">
          <Component
            components={{
              h1: GetH1({
                updated: frontmatter.updated,
                published: frontmatter.published,
                created: frontmatter.created,
              }),
              ...components,
            }}
          />
        </main>

        <div className="flex items-center text-sm space-x-8">
          <a
            href={`https://twitter.com/search?q=${encodeURIComponent(
              frontmatter.canonical,
            )}`}
          >
            Discuss on Twitter
          </a>
          <a
            href={`https://twitter.com/messages/compose?recipient_id=${twitterId}`}
          >
            PM via Twitter
          </a>
          <div className="mx-auto flex-grow mt-1 border-t-2 border-black/10 dark:border-white/10" />
          <div className="flex space-x-4">
            <div className="font-bold">Share</div>
            <TwitterShareButton
              title={`${frontmatter.title} via ${twitterHandle}\n`}
              // via={twitterHandle.substring(1)}
              url={frontmatter.canonical}
            >
              Twitter
            </TwitterShareButton>
            <RedditShareButton
              title={frontmatter.title}
              url={frontmatter.canonical}
            >
              Reddit
            </RedditShareButton>
            {/* https://twitter.com/intent/tweet?text=[TWEET] */}
            {/* https://news.ycombinator.com/submitlink?u=[URL] */}
            {/* https://www.reddit.com/submit?url=[URL] */}
          </div>
        </div>

        <div className="flex space-x-10">
          <img
            src="https://github.com/canrau.png"
            alt="Can Rau"
            className="rounded-egg w-40 h-40"
          />
          <div className="space-y-3">
            <div className="text-2xl">Can Rau</div>
            <p>
              Doing web-development since around 2000, building my digital
              garden with a mix of back-to-the-roots-use-the-platform and modern
              edge-rendered-client-side-magic tech 📻🚀
            </p>
            <p>Living and working in the tropical rainforest of Perú 🐒</p>
          </div>
        </div>
      </div>
    </>
  );
}
