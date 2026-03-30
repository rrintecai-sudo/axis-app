// This file is a stub overwritten by esbuild during the build step.
// See apps/api/build.mjs and apps/api/src/handler.ts
module.exports = async function handler(_req, res) {
  res.statusCode = 503;
  res.end('Build in progress');
};
