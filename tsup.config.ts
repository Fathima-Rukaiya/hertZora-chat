
// tsup.config.ts
// import { defineConfig } from "tsup";

// export default defineConfig({
//   entry: ["src/index.tsx"],    // your main entry
//   format: ["iife"],            // browser-ready <script>
//   globalName: "HostieChat",    // exposed as window.HostieChat
//   outDir: "dist",
//   bundle: true,
//   minify: true,
//   sourcemap: true,
//   loader: { ".css": "css" },   // converts CSS imports into strings
//   define: {
//     "process.env.NODE_ENV": JSON.stringify("production"), // fixes process error
//   },
// });

import { defineConfig } from "tsup";

export default defineConfig({
  entry: ["src/index.tsx"],
  format: ["iife"],            // browser-ready <script>
  globalName: "HostieChat",    // exposed as window.HostieChat
  outDir: "dist",
  bundle: true,
  minify: true,
  sourcemap: true,
  loader: {
  ".css": "text",
},

  define: {
    "process.env.NODE_ENV": JSON.stringify("production"),
  },
  external: [], // ⚡ Make sure lucide-react, iconsax-react, and react are NOT external
});
