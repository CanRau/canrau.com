import * as mdxBundler from "mdx-bundler";
import { remarkMdxImages } from "remark-mdx-images";
import { basename, dirname, join, resolve } from "path";
import { readFile } from "fs/promises";

type IBundleMdx = {
  cwd: string;
  file: string;
};

export const getContentPath = (slug: string) => resolve("content", slug);

export const getFilePath = (contentPath: string, filename: string) =>
  resolve(contentPath, filename);

export const bundleMDX = async ({ cwd, file }: IBundleMdx) => {
  const source = await readFile(file, { encoding: "utf-8" });
  const { default: remarkGfm } = await import("remark-gfm");
  const { default: remarkBreaks } = await import("remark-breaks");
  const { default: remarkFootnotes } = await import("remark-footnotes");
  const { default: rehypeSlug } = await import("rehype-slug");
  const { default: rehypeAutolinkHeadings } = await import(
    "rehype-autolink-headings"
  );
  // todo: maybe use Ryan's [like KCD](https://github.com/kentcdodds/kentcdodds.com/commit/9d853711ed0bf985c0dbda1981184f47965a41b9)
  const { default: rehypePrism } = await import("rehype-prism-plus");

  return mdxBundler.bundleMDX({
    cwd,
    // file,
    source,
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
        rehypeAutolinkHeadings,
        [rehypePrism, { ignoreMissing: true }],
        // () => {
        //   return (tree) => {
        //     visit(tree, 'element', (node, index, parent) => {
        //       let [token, type] = node.properties.className || []
        //       if (token === 'token') {
        //         node.properties.className = [tokenClassNames[type]]
        //       }
        //     })
        //   }
        // },
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
