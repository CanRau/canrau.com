const config = {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
};

if (process.env.NODE_ENV === "production") {
  config.plugins.cssnano = {
    preset: "default",
  };
}

module.exports = config;
