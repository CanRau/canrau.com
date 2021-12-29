/**
 * @type {import('@remix-run/dev/config').AppConfig}
 */
module.exports = {
  appDirectory: "app",
  browserBuildDirectory: "public/build",
  publicPath: "/build/",
  serverBuildDirectory: "build",
  devServerPort: 8002,
  // serverPlatform: ​"neutral"​, // found in https://discord.com/channels/770287896669978684/923127300789248051/923130439626002453
  // serverPlatform: ​"node"​,
  // serverModuleFormat: "esm", // todo: verify [serverModuleFormat](https://github.com/remix-run/remix/pull/976)
};
