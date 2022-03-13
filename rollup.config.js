import svelte from "rollup-plugin-svelte";
import commonjs from "@rollup/plugin-commonjs";
import resolve from "@rollup/plugin-node-resolve";
import livereload from "rollup-plugin-livereload";
import { terser } from "rollup-plugin-terser";
import css from "rollup-plugin-css-only";
import serve from "rollup-plugin-serve";

const production = !process.env.ROLLUP_WATCH;

export default [
  {
    input: "src/background/main.js",
    output: {
      sourcemap: !production,
      format: "iife",
      file: "dist/background/bundle.js",
    },
  },
  {
    input: "src/popup/main.js",
    output: {
      sourcemap: !production,
      format: "iife",
      name: "app",
      file: "dist/popup/bundle.js",
    },
    plugins: [
      svelte({
        compilerOptions: {
          dev: !production,
        },
      }),
      css({ output: "bundle.css" }),
      resolve({
        browser: true,
        dedupe: ["svelte"],
      }),
      commonjs(),
      !production && serve("dist"),
      !production && livereload("dist/popup/"),
      production && terser(),
    ],
  },
];
