import * as mdxBundler from "mdx-bundler";
import { remarkMdxImages } from "remark-mdx-images";
import { join, resolve } from "path";
import { readFile } from "fs/promises";

type IBundleMdx = {
  cwd: string;
  file: string;
};

export const getContentPath = (slug: string) => resolve("content", slug);

export const getFilePath = (contentPath: string, filename: string) =>
  resolve(contentPath, filename);

export const bundleMDX = async ({ cwd, file }: IBundleMdx) => {
  // const source = await readFile(file, { encoding: "utf-8" });
  const { default: remarkGfm } = await import("remark-gfm");
  const { default: remarkBreaks } = await import("remark-breaks");
  const { default: remarkFootnotes } = await import("remark-footnotes");
  const { default: rehypeSlug } = await import("rehype-slug");
  const { default: linkHeadings } = await import("rehype-autolink-headings");
  // todo: maybe use Ryan's [like KCD](https://github.com/kentcdodds/kentcdodds.com/commit/9d853711ed0bf985c0dbda1981184f47965a41b9)
  const { default: rehypePrism } = await import("rehype-prism-plus");
  const { visit } = await import("unist-util-visit");

  return mdxBundler.bundleMDX({
    cwd,
    file,
    // source,
    // bundleDirectory: resolve("public", "build"),
    // bundlePath: resolve("public"),
    xdmOptions: (options) => {
      options.remarkPlugins = [
        ...(options.remarkPlugins ?? []),
        remarkMdxImages,
        // [remarkTocHeadings, { exportRef: toc }],
        remarkGfm,
        remarkBreaks,
        // remarkCodeTitles,
        [remarkFootnotes, { inlineNotes: true }],
        // remarkMath,
        // remarkImgToJsx,
      ];

      options.rehypePlugins = [
        ...(options.rehypePlugins ?? []),
        rehypeSlug,
        linkHeadings,
        [rehypePrism, { ignoreMissing: true, showLineNumbers: true }],
        () => {
          // const tokenClassNames: Record<string, string> = {
          //   tag: "text-code-red",
          //   "attr-name": "text-code-yellow",
          //   "attr-value": "text-code-green",
          //   deleted: "text-code-red",
          //   inserted: "text-code-green",
          //   punctuation: "text-code-white",
          //   keyword: "text-code-purple",
          //   string: "text-code-green",
          //   function: "text-code-blue",
          //   boolean: "text-code-red",
          //   comment: "text-gray-400 italic",
          // };
          return (tree) => {
            visit(tree, "element", (node, index, parent) => {
              let [token, type] = node.properties.className || [];
              // console.log({ token, type });
              if (token === "code-line" && type === "line-number") {
                // todo: not working for multiple code-blocks on the same page (yet)
                node.properties.id = `L${node.properties.line}`;
              }
              if (token === "token") {
                // node.properties.className = [tokenClassNames[type]];
              }
              if (node.tagName === "pre") {
                const [lang] = node.properties.className || [];
                if (lang) {
                  node.properties.dataLang = lang.replace("language-", "");
                }
              }
            });
          };
        },
      ];

      return options;
    },
    esbuildOptions: (options) => {
      // Set the `outdir` to a public location for this bundle.
      // console.log("esbuildOptions", resolve("public"));
      // options.outdir = resolve("public", "build", "_assets");
      options.outdir = resolve("public/build/_assets");
      options.loader = {
        ...options.loader,
        ".png": "file",
        ".jpg": "file",
        ".jpeg": "file",
      };
      // Set the public path to /img/about
      options.publicPath = join("/build/_assets");

      // Set write to true so that esbuild will output the files.
      options.write = true;

      return options;
    },
  });
};
