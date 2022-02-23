// if (process.env.NODE_ENV !== "production") {
//   // note: [from](https://remysharp.com/2014/05/23/where-is-that-console-log)
//   // alternatives: https://gist.github.com/kjellski/6fec619e80ca94ed2e2a
//   // https://gist.github.com/fdn/85563337ca5cd815ca6e
//   ["log", "warn"].forEach(function (method) {
//     var old = console[method];
//     console[method] = function () {
//       var stack = new Error().stack.split(/\n/);
//       // Chrome includes a single "Error" line, FF doesn't.
//       if (stack[0].indexOf("Error") === 0) {
//         stack = stack.slice(1);
//       }
//       var args = [].slice.apply(arguments).concat([stack[1].trim()]);
//       return old.apply(console, args);
//     };
//   });
// }

/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */
module.exports = {
  serverBuildTarget: "node-cjs",
  appDirectory: "app",
  browserBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildPath: "build/index.js",
  devServerPort: 8002,
  sourcemap: true,
  // serverDependenciesToBundle: [
  //   "@aws-sdk/client-s3",
  //   "@aws-sdk/lib-storage",
  //   "@aws-sdk/middleware-apply-body-checksum",
  //   "@sindresorhus/slugify",
  //   "hast-util-to-string",
  //   "rehype-autolink-headings",
  //   "rehype-external-links",
  //   "rehype-parse",
  //   "rehype-prism-plus",
  //   "rehype-slug",
  //   "remark-breaks",
  //   "remark-footnotes",
  //   "remark-gfm",
  //   "remark-github",
  //   "remark-toc",
  //   "unified",
  //   "unist-util-visit",
  // ],
};
