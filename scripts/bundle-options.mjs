// How the plugin is bundled for Ajour's sandboxed worker (plugin API 4): one ES
// module, built for the browser. The worker has no Node built-ins, no `Buffer`
// and no `process`, so nothing may resolve to one: esbuild's browser platform
// fails the build if a dependency imports a Node built-in. ical.js is inside
// the bundle, because Ajour installs only plugin.json and dist/.
export const bundleOptions = {
  entryPoints: ["src/plugin.ts"],
  bundle: true,
  platform: "browser",
  format: "esm",
  target: "es2022",
  legalComments: "eof",
  // ical.js is MPL-2.0: name it and its source in the bundle.
  banner: {
    js: "/*! ajc-ics, MIT, https://github.com/les-cabochons/ajc-ics. Bundles ical.js 2.2.1, MPL-2.0 (https://mozilla.org/MPL/2.0/), source at https://github.com/kewisch/ical.js. */",
  },
};
