const fs = require('fs');
const userHtml = fs.readFileSync('user_preloader.html', 'utf-8');

// Extract just the container part and styles
const styleMatch = userHtml.match(/<style>([\s\S]*?)<\/style>/);
const bodyMatch = userHtml.match(/<div class="container">([\s\S]*?)<\/div>\s*<\/body>/);

if (styleMatch && bodyMatch) {
    let styles = styleMatch[1];
    let body = `<div class="container">${bodyMatch[1]}</div>`;

    // Prefix classes
    styles = styles.replace(/\.container\b/g, '.otivo-pre-container');
    body = body.replace(/class="container"/g, 'class="otivo-pre-container"');

    styles = styles.replace(/\.absolute\b/g, '.otivo-pre-absolute');
    body = body.replace(/class="absolute"/g, 'class="otivo-pre-absolute"');

    styles = styles.replace(/\.inline-block\b/g, '.otivo-pre-inline-block');
    body = body.replace(/class="inline-block"/g, 'class="otivo-pre-inline-block"');
    body = body.replace(/class="inline-block pulse-slow"/g, 'class="otivo-pre-inline-block otivo-pre-pulse-slow"');

    styles = styles.replace(/\.loader\b/g, '.otivo-pre-loader');
    body = body.replace(/class="loader"/g, 'class="otivo-pre-loader"');

    styles = styles.replace(/\.dash\b/g, '.otivo-pre-dash');
    body = body.replace(/class="dash"/g, 'class="otivo-pre-dash"');

    styles = styles.replace(/\.spin\b/g, '.otivo-pre-spin');
    body = body.replace(/class="spin"/g, 'class="otivo-pre-spin"');

    styles = styles.replace(/\.pulse-slow\b/g, '.otivo-pre-pulse-slow');

    styles = styles.replace(/\.brand-caption\b/g, '.otivo-pre-brand-caption');
    body = body.replace(/class="brand-caption"/g, 'class="otivo-pre-brand-caption"');

    styles = styles.replace(/\.accent-bull\b/g, '.otivo-pre-accent-bull');
    body = body.replace(/class="accent-bull"/g, 'class="otivo-pre-accent-bull"');

    styles = styles.replace(/\.accent-bear\b/g, '.otivo-pre-accent-bear');
    body = body.replace(/class="accent-bear"/g, 'class="otivo-pre-accent-bear"');

    styles = styles.replace(/\.ticker-line\b/g, '.otivo-pre-ticker-line');
    body = body.replace(/class="ticker-line"/g, 'class="otivo-pre-ticker-line"');

    // Fix absolute CSS to be actually absolute (Tailwind conflicts)
    styles = styles + '\n.otivo-pre-absolute { position: absolute; }\n';

    // Fix body style which affects the whole app!
    styles = styles.replace(/body\s*\{([\s\S]*?)\}/, '#otivo-preloader-root {$1\n    position: fixed;\n    inset: 0;\n    z-index: 999999;\n    transition: opacity 0.65s cubic-bezier(0.16, 1, 0.3, 1), transform 0.65s cubic-bezier(0.16, 1, 0.3, 1);\n}\n#otivo-preloader-root.otivo-preloader-exit {\n    opacity: 0;\n    transform: scale(1.02);\n    pointer-events: none;\n}');

    // Inject into index.html
    const template = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>OTIVO Chart View</title>
    <link rel="icon" type="image/png" href="/logo.png">
    <link rel="shortcut icon" type="image/png" href="/logo.png">
    <link rel="apple-touch-icon" href="/logo.png">
    <meta name="description" content="High-performance real-time trading platform with AI-driven analytics, live tick data streaming, and advanced charting.">
    
    <!-- Apply theme before render to prevent flash -->
    <script>
      (function() {
        try {
          var state = localStorage.getItem('otivo-market-storage');
          if (state) {
            var parsed = JSON.parse(state);
            if (parsed && parsed.state && parsed.state.theme === 'light') {
              document.documentElement.classList.remove('dark');
            } else {
              document.documentElement.classList.add('dark');
            }
          } else {
            document.documentElement.classList.add('dark');
          }
        } catch (e) {
          document.documentElement.classList.add('dark');
        }
      })();
    </script>
    <style>
${styles}
    </style>
  </head>
  <body>
    <!-- Instant Native OTIVO Preloader -->
    <div id="otivo-preloader-root">
${body}
    </div>
    
    <div id="root"></div>
    <script type="module" src="/src/main.tsx"></script>
  </body>
</html>`;

    fs.writeFileSync('index.html', template);
    console.log("Successfully rewrote index.html");
} else {
    console.error("Could not parse user_preloader.html");
}
