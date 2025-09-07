// eslint.config.js
module.exports = [
  {
    files: ["**/*.js"],
    languageOptions: {
      ecmaVersion: "latest",
      sourceType: "module",
      globals: {
        browser: true,
        lucide: "readonly",
        echarts: "readonly",
        AOS: "readonly"
      }
    },
    rules: {
      "no-unused-vars": "warn"
    }
  }
];
