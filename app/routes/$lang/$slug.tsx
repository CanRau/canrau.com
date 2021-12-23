import {
  type MetaFunction,
  type LoaderFunction,
  type LinksFunction,
  type RouteHandle,
  json,
  useLoaderData,
} from "remix";
import { useMemo } from "react";
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
import prismPlus from "~/styles/prism-plus.css";
import prismTheme from "~/styles/prism-theme.css";
import { rootUrl, domain, titleSeperator, twitterHandle } from "/config";
import type { Lang } from "/types";
import { NotFoundError } from "~/utils/error-responses";
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
  frontmatter: { [key: string]: any };
  code: string;
  canonical: string;
  totalPathVisits: number;
};

// export const handle: RouteHandle = {
//   canonical: (pathname: string) => pathname,
// };

export const handle: RouteHandle = { hydrate: ({frontmatter}: LoaderData) => frontmatter?.hydrate };

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
  const {jsonld} = getMDXExport(code);

  const canonical =
    frontmatter.canonical ||
    `${rootUrl}/${frontmatter?.lang}${frontmatter?.slug}`;
  return json({ frontmatter, code, canonical, totalPathVisits, jsonld });
};

// note: more on [component substitution](https://github.com/wooorm/xdm#components)
const components = {
  h1: typography.H1,
  h2: typography.H2,
  h3: typography.H3,
  h4: typography.H4,
  h5: typography.H5,
  h6: typography.H6,
  p: typography.Paragraph,
};

// const TableOfContents = (toc: Array<TocEntry>) => {
//   return <li></li>
// }
type IGetH1 = {
  published: Date;
  updated: Date;
};
const GetH1 =
  ({ published, updated, created }: IGetH1) =>
  (props) => {
    // todo: why is parseISO necessary??
    // note: [schema.org/Date](https://schema.org/Date)
    return (
      <>
        <typography.H1 {...props} />
        <div className="flex space-x-4 text-sm text-zinc-400">
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
          {published && <div>
            Published:&nbsp;
            <time
              className="ml-1"
              // dateTime={published || created} property="datePublished"
            >
              {formatDate(parseISO(published), "yyyy-MM-dd")}
            </time>
          </div>}
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
      <main className="prose prose-lg lg:prose-xl dark:prose-invert mx-auto">
        <Component
          components={{
            h1: GetH1({
              updated: frontmatter.updated,
              published: frontmatter.published,
              created: frontmatter.created,
            }),
            /*components*/
          }}
        />
      </main>
    </>
  );
}
