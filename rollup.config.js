import resolve from "@rollup/plugin-node-resolve"
import commonjs from "@rollup/plugin-commonjs"
import babel from "@rollup/plugin-babel"
import copy from "rollup-plugin-copy"

const plugins = [
  resolve(),
  babel({
    babelHelpers: "bundled",
    presets: ["@babel/env"],
    plugins: ["@babel/plugin-transform-classes"],
  }),
  commonjs(),
  copy({
    targets: [
      {src: "manifest.json", dest: "dist"},
      {src: "src/popup/popup.html", dest: "dist"},
      {src: "src/popup/popup.css", dest: "dist"},
      {src: "assets/*", dest: "dist/assets"},
    ],
  }),
]

export default [
  {
    input: "src/background/index.js",
    output: {
      file: "dist/background.js",
      format: "iife",
    },
    plugins,
  },
  {
    input: "src/popup/popup.js",
    output: {
      file: "dist/popup.js",
      format: "iife",
    },
    plugins,
  },
]
