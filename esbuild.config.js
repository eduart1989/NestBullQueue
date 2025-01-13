const esbuild = require('esbuild');

esbuild
  .build({
    entryPoints: ['./src/main.ts'],
    bundle: true,
    platform: 'node',
    target: 'node18',
    outdir: './dist/main.js',
    minify: true,
  })
  .catch(() => process.exit(1));
