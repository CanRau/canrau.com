import type { MetaFunction, LoaderFunction, LinksFunction } from "remix";
import { useLoaderData, json, Link, redirect } from "remix";
import { useMemo, FC } from "react";
// import { bundleMDX } from "mdx-bundler";
import {
  bundleMDX,
  getContentPath,
  getFilePath,
} from "~/utils/compile-mdx.server";
import { getMDXComponent, getMDXExport } from "mdx-bundler/client";
import * as typography from "~/components/typography";
import prismPlus from "~/styles/prism-plus.css";
import prismTheme from "~/styles/prism-theme.css";

export const meta: MetaFunction = ({ data, parentsData, location, params }) => {
  console.log({ parentsData });
  console.log({ location });
  console.log({ params });
  const { title, description, lang, slug, cover } = data.frontmatter;
  return {
    title: title || "Missing Title",
    description: description || "Missing description",
    "og:image": cover ? `/build/_assets${slug}/${cover}` : "",
    "twitter:image": cover ? `/build/_assets${slug}/${cover}` : "",
    // 'og:url': url,
    // 'og:title': title,
    // 'og:description': description,
    // 'og:image': image,
    // 'twitter:card': image ? 'summary_large_image' : 'summary',
    // 'twitter:creator': '@kentcdodds',
    // 'twitter:site': '@kentcdodds',
    // 'twitter:title': title,
    // 'twitter:description': description,
    // 'twitter:image': image,
    // 'twitter:alt': title,
  };
};

export const links: LinksFunction = () => {
  return [
    { rel: "stylesheet", href: prismPlus },
    { rel: "stylesheet", href: prismTheme },
    // { rel: "stylesheet", href: globalStylesUrl },
    // {
    //   rel: "stylesheet",
    //   href: darkStylesUrl,
    //   media: "(prefers-color-scheme: dark)",
    // },
  ];
};

// Loaders provide data to components and are only ever called on the server, so
// you can connect to a database or run any server side code you want right next
// to the component that renders it.
// https://remix.run/api/conventions#loader
export const loader: LoaderFunction = async ({ params }) => {
  // console.log({ params });
  const lang = params.lang || "en";
  const slug = params.slug || "index";
  const filename = `${lang}.mdx`;
  const contentPath = getContentPath(slug);
  const { frontmatter, code, ...rest } = await bundleMDX({
    cwd: contentPath,
    file: getFilePath(contentPath, filename),
  });
  // console.log(rest.matter.data);
  if (frontmatter.status !== "published") {
    throw new Response("Not Found", { status: 404 });
  }
  return { frontmatter, code };
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

export default function Post() {
  const { code, frontmatter } = useLoaderData();
  const Component = useMemo(() => getMDXComponent(code), [code]);
  // console.log({ frontmatter }, getMDXExport(code));
  return (
    <>
      <main className="prose prose-light dark:prose-dark mx-auto">
        <Component components={components} />
      </main>
    </>
  );
}
