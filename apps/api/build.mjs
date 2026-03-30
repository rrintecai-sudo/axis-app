import { build } from 'esbuild';

await build({
  entryPoints: ['src/handler.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  outfile: 'api/index.js',
  format: 'cjs',
  // Prisma client has native binaries — must stay external
  external: ['@prisma/client', '.prisma/client'],
  sourcemap: false,
  minify: false,
  logLevel: 'info',
});
