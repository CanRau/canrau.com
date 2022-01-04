if (process.env.NODE_ENV !== "production") {
  // note: [from](https://remysharp.com/2014/05/23/where-is-that-console-log)
  // alternatives: https://gist.github.com/kjellski/6fec619e80ca94ed2e2a
  // https://gist.github.com/fdn/85563337ca5cd815ca6e
  ["log", "warn"].forEach(function (method) {
    var old = console[method];
    console[method] = function () {
      var stack = new Error().stack.split(/\n/);
      // Chrome includes a single "Error" line, FF doesn't.
      if (stack[0].indexOf("Error") === 0) {
        stack = stack.slice(1);
      }
      var args = [].slice.apply(arguments).concat([stack[1].trim()]);
      return old.apply(console, args);
    };
  });
}

/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */
module.exports = {
  appDirectory: "app",
  browserBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildDirectory: "build",
  devServerPort: 8002,
  // serverModuleFormat: "esm", // todo: verify [serverModuleFormat](https://github.com/remix-run/remix/pull/976)
};
