// via https://github.com/kentcdodds/kentcdodds.com/blob/c9231853d6621659d352754cdcde7c6eb0462517/.eslintrc.js
module.exports = {
  extends: [
    "eslint-config-kentcdodds",
    "eslint-config-kentcdodds/jest",
    "eslint-config-kentcdodds/jsx-a11y",
    "eslint-config-kentcdodds/react",
  ],
  parserOptions: {
    tsconfigRootDir: __dirname,
    project: "./tsconfig.json",
  },
  rules: {
    "no-console": "off",
    "react/react-in-jsx-scope": "off",

    // meh...
    "@typescript-eslint/no-non-null-assertion": "off",
    "@typescript-eslint/sort-type-union-intersection-members": "off",
    "jsx-a11y/media-has-caption": "off",
    "jsx-a11y/label-has-associated-control": "off",
    "jsx-a11y/alt-text": "off", // it's not smart enough...
    "@babel/new-cap": "off",
    "react/jsx-filename-extension": "off",
    "@typescript-eslint/no-namespace": "off",

    // I can't figure these out:
    "@typescript-eslint/no-unsafe-call": "off",
    "@typescript-eslint/no-unsafe-assignment": "off",
    "@typescript-eslint/no-unsafe-member-access": "off",

    // enable these again someday:
    "@typescript-eslint/no-unsafe-argument": "off",

    // this one isn't smart enough for our "~/" imports
    "import/order": "off",
    "import/no-absolute-path": "off",

    // for CatchBoundaries
    "@typescript-eslint/no-throw-literal": "off",
  },
};
