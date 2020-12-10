/* eslint-disable-next-line no-undef */
module.exports = {
  root: true,
  parser: "@typescript-eslint/parser",
  plugins: ["@typescript-eslint"],
  extends: [
    "eslint:recommended",
    "plugin:@typescript-eslint/eslint-recommended",
    "plugin:@typescript-eslint/recommended",
  ],
  rules: {
    "@typescript-eslint/explicit-function-return-type": "off",
    "prefer-const": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "no-fallthrough": "off",
  },
  overrides: [
    {
      files: ["*.tsx", "*.jsx"],
      rules: {
        "@typescript-eslint/explicit-module-boundary-types": "off",
      },
    },
  ],
};
