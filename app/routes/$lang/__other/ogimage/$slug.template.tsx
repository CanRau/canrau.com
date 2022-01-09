import matter from "gray-matter";
import { json, Links, LoaderFunction, useLoaderData } from "remix";
import { readFile } from "~/utils.server";
import { getContentPath, getFilePath } from "~/utils/compile-mdx.server";
import { NotFoundError } from "~/utils/error-responses";
import { Frontmatter } from "~/utils/mdx.server";
import { defaultLang, domain } from "/config";
import { Lang } from "/types";

type LoaderData = {
  status: string;
  title: string;
  lang: string;
  hydrate: boolean;
  description: string;
  author: string;
  mdx: string;
};

export const loader: LoaderFunction = async ({ params }) => {
  const lang = (params.lang || defaultLang) as Lang;
  const slug = params.slug || "index";
  const filename = `${lang}.mdx`;
  const contentPath = getContentPath(slug);
  const filePath = getFilePath(contentPath, filename);
  const source = await readFile(filePath, { encoding: "utf-8" }).catch(() => {
    throw NotFoundError(lang);
  });

  const {
    data: { status, title, hydrate, description, author, mdx },
  } = matter(source) as unknown as { data: Frontmatter };

  // todo: use `hydrate` to distinguish interactive from non-interactive posts

  return json({ status, title, hydrate, description, author, mdx, lang });
};

export default function OgImage() {
  const { status, title, hydrate, description, author, mdx, lang } =
    useLoaderData<LoaderData>();
  return (
    <>
      <html lang="en">
        <head>
          <meta charSet="UTF-8" />
          <meta
            name="viewport"
            content="width=device-width, initial-scale=1.0"
          />
          <title>{title}</title>
          <Links />
        </head>
        <body className="font-[Oswald] font-bold">
          {/* <div className="w-[1280px] h-[720px] flex flex-col items-center justify-center border"> */}
          <div
            id="ogimage"
            className="w-[1200px] h-[630px] bg-black rounded-2xl"
          >
            <div className="h-full bg-gradient-to-tr from-skin-accent/60 to-skin-accent p-4 rounded-2xl">
              <div className="p-10 bg-zinc-800 text-zinc-200 h-full border border-zinc-300 rounded-lg flex flex-col justify-center items-center space-y-10">
                <h1 className="text-8xl leading-[1.2] text-center">{title}</h1>
                <img
                  src="https://github.com/canrau.png"
                  alt="Can Rau Avatar"
                  className="rounded-egg w-40 h-40"
                />
                <div className="text-5xl text-center font-light">{domain}</div>
              </div>
            </div>
          </div>
        </body>
      </html>
    </>
  );
}
