import buble from 'rollup-plugin-buble';
import resolve from 'rollup-plugin-node-resolve';
import commonjs from 'rollup-plugin-commonjs';
import liveReload from 'rollup-plugin-livereload';
import serve from 'rollup-plugin-serve';
import uglify from 'rollup-plugin-uglify';
import string from 'rollup-plugin-string';

const PORT = 8080;
// console.log(`open http://localhost:${PORT}/`);

export default {
  entry: 'index.js',
  sourceMap: true,
  targets: [
    {
      format: 'umd',
      moduleName: 'dl',
      dest: `dist/template.js`,
    }
  ],
  plugins: [
    resolve({
      jsnext: true,
      browser: true,
    }),
    string({
      include: ["**/*.txt", "**/*.svg", "**/*.html", "**/*.css", "**/*.base64"]
    }),
    buble({
      exclude: 'node_modules',
      target: { chrome: 52, safari: 9, edge: 13, firefox: 48, }
    }),
    commonjs(),
    // uglify(),
    // liveReload(),
    // serve({port: PORT}),
  ]
};