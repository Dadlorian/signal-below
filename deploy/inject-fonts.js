// Runs in the build container right after `vite build`. Never edits the son's source files.
// His CSS pulls Google Fonts with an @import, so the browser only learns about the fonts after
// it has downloaded and read the whole CSS file. We copy that same URL into the built
// index.html as a <link>, so the font download starts while the page is still loading.
// If anything looks different (no font URL, no </head>), do nothing. A build must never fail on this.
const fs = require('fs');
try {
  const css = fs.readFileSync('src/index.css', 'utf8');
  const found = css.match(/https:\/\/fonts\.googleapis\.com\/css2\?[^'")\s]+/);
  if (!found) { console.log('fonts: no Google Fonts URL in src/index.css, nothing to do'); process.exit(0); }
  const url = found[0];
  const safeUrl = url.replace(/&amp;/g, '&').replace(/&/g, '&amp;');
  const file = 'dist/index.html';
  let html = fs.readFileSync(file, 'utf8');
  if (html.includes(safeUrl) || html.includes(url)) { console.log('fonts: index.html already links the fonts'); process.exit(0); }
  if (!html.includes('</head>')) { console.log('fonts: no </head> found, skipping'); process.exit(0); }
  html = html.replace('</head>', `  <link rel="stylesheet" href="${safeUrl}">\n  </head>`);
  fs.writeFileSync(file, html);
  console.log('fonts: added early font link to index.html');
} catch (e) {
  console.log('fonts: skipped (' + e.message + ')');
}
