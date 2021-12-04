import type { MetaFunction, LoaderFunction, LinksFunction } from "remix";
import { useLoaderData, json, Link, redirect } from "remix";
import { useMemo } from "react";
// import { bundleMDX } from "mdx-bundler";
import {
  bundleMDX,
  getContentPath,
  getFilePath,
} from "~/utils/compile-mdx.server";
import { getMDXComponent, getMDXExport } from "mdx-bundler/client";

export const meta: MetaFunction = ({ data, parentsData, location, params }) => {
  console.log({ parentsData });
  console.log({ location });
  console.log({ params });
  const { title, description, lang, slug, cover } = data.frontmatter;
  return {
    title: title || "Missing Title",
    description: description || "Missing description",
    "og:image": cover ? `/build/_assets${slug}/${cover}` : "",
  };
};

export const links: LinksFunction = () => {
  return [
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

export default function Post() {
  const { code, frontmatter } = useLoaderData();
  const Component = useMemo(() => getMDXComponent(code), [code]);
  // console.log({ frontmatter }, getMDXExport(code));
  return (
    <>
      <main>
        <Component />
      </main>
    </>
  );
}
