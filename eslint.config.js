import globals from "globals";
import pluginJs from "@eslint/js";

export default [
  {
    ignores: ["dist/**/*"],
    languageOptions: {
      globals: {
        ...globals.browser,
        ...globals.webextensions,
      }
    },
    rules: {
      ...pluginJs.configs.recommended.rules,
      "no-unused-vars": ["error", {
        caughtErrors: "none",
        args: "none",
      }],
    }
  },
];

