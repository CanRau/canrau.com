// via https://github.com/kentcdodds/kentcdodds.com/blob/c9231853d6621659d352754cdcde7c6eb0462517/prettier.config.js
process.env.RUNNING_PRETTIER = "true";
console.log("NODE_ENV", process.env.NODE_ENV);
module.exports = {
  arrowParens: "always",
  bracketSpacing: true,
  embeddedLanguageFormatting: "auto",
  endOfLine: "lf",
  htmlWhitespaceSensitivity: "css",
  insertPragma: false,
  jsxBracketSameLine: false,
  jsxSingleQuote: false,
  printWidth: 100,
  proseWrap: "preserve",
  quoteProps: "as-needed",
  requirePragma: false,
  semi: true,
  singleQuote: false,
  tabWidth: 2,
  trailingComma: "all",
  useTabs: false,
};
