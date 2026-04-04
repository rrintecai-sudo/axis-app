import { build } from 'esbuild';

await build({
  entryPoints: ['src/handler.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'api/index.js',
  format: 'cjs',
  // Prisma client has native binaries — must stay external
  // @vercel/functions must stay external (uses Vercel runtime internals)
  external: ['@prisma/client', '.prisma/client', '@vercel/functions'],
  sourcemap: false,
  minify: false,
  logLevel: 'info',
  // Resolve node_modules relative to the output file location
  banner: {
    js: `
const path = require('path');
const Module = require('module');
const originalResolve = Module._resolveFilename.bind(Module);
Module._resolveFilename = function(request, parent, isMain, options) {
  if (request === '@prisma/client' || request.startsWith('.prisma/')) {
    try {
      return originalResolve(request, parent, isMain, options);
    } catch(e) {
      const newParent = { ...parent, filename: __filename, paths: Module._nodeModulePaths(__dirname) };
      return originalResolve(request, newParent, isMain, options);
    }
  }
  return originalResolve(request, parent, isMain, options);
};
`.trim(),
  },
});
