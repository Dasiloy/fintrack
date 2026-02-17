/** @type {import('prettier').Config & import('prettier-plugin-tailwindcss').PluginOptions} */
export default {
  singleQuote: true,
  trailingComma: "all",
  printWidth: 100,
  tabWidth: 2,
  semi: true,
  plugins: ["prettier-plugin-tailwindcss"],
};
