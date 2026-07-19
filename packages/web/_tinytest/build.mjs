import { build } from 'vite'
await build({ root: new URL('.', import.meta.url).pathname, build: { outDir: 'out', write: true, minify: false } })
console.log('TINY_BUILD_OK')
