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
