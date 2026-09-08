const fs = require('fs');

let html = fs.readFileSync('index.html', 'utf-8');

// Prefix classes to avoid tailwind conflicts
html = html.replace(/\.container\b/g, '.otivo-pre-container');
html = html.replace(/class="container"/g, 'class="otivo-pre-container"');

html = html.replace(/\.absolute\b/g, '.otivo-pre-absolute');
html = html.replace(/class="absolute"/g, 'class="otivo-pre-absolute"');

html = html.replace(/\.inline-block\b/g, '.otivo-pre-inline-block');
html = html.replace(/class="inline-block"/g, 'class="otivo-pre-inline-block"');
html = html.replace(/class="inline-block/g, 'class="otivo-pre-inline-block');

html = html.replace(/\.loader\b/g, '.otivo-pre-loader');
html = html.replace(/class="loader"/g, 'class="otivo-pre-loader"');

html = html.replace(/\.dash\b/g, '.otivo-pre-dash');
html = html.replace(/class="dash"/g, 'class="otivo-pre-dash"');

html = html.replace(/\.spin\b/g, '.otivo-pre-spin');
html = html.replace(/class="spin"/g, 'class="otivo-pre-spin"');

html = html.replace(/\.pulse-slow\b/g, '.otivo-pre-pulse-slow');
html = html.replace(/class="inline-block pulse-slow"/g, 'class="otivo-pre-inline-block otivo-pre-pulse-slow"');
html = html.replace(/class="otivo-pre-inline-block pulse-slow"/g, 'class="otivo-pre-inline-block otivo-pre-pulse-slow"');

html = html.replace(/\.brand-caption\b/g, '.otivo-pre-brand-caption');
html = html.replace(/class="brand-caption"/g, 'class="otivo-pre-brand-caption"');

html = html.replace(/\.accent-bull\b/g, '.otivo-pre-accent-bull');
html = html.replace(/class="accent-bull"/g, 'class="otivo-pre-accent-bull"');

html = html.replace(/\.accent-bear\b/g, '.otivo-pre-accent-bear');
html = html.replace(/class="accent-bear"/g, 'class="otivo-pre-accent-bear"');

html = html.replace(/\.ticker-line\b/g, '.otivo-pre-ticker-line');
html = html.replace(/class="ticker-line"/g, 'class="otivo-pre-ticker-line"');

// Fix body style which affects the whole app!
// The user put body styling in the style tag. We should scope it to #otivo-preloader-root
html = html.replace(/body\s*\{([\s\S]*?)\}/, '#otivo-preloader-root {$1\n    position: fixed;\n    inset: 0;\n    z-index: 999999;\n    transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);\n}\n#otivo-preloader-root.otivo-preloader-exit {\n    opacity: 0;\n    transform: scale(1.02);\n    pointer-events: none;\n}');

fs.writeFileSync('index.html', html);
