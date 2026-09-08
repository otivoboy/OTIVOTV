const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');

// Insert a useEffect to sync theme
if (!appTsx.includes("document.documentElement.classList.toggle('dark', theme === 'dark')")) {
  appTsx = appTsx.replace(
    "const { activeSymbol, activeTimeframe,",
    "useEffect(() => {\n    if (theme === 'dark') {\n      document.documentElement.classList.add('dark');\n    } else {\n      document.documentElement.classList.remove('dark');\n    }\n  }, [theme]);\n\n  const { activeSymbol, activeTimeframe,"
  );
  fs.writeFileSync('src/App.tsx', appTsx);
}
