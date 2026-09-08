const fs = require('fs');

let appTsx = fs.readFileSync('src/App.tsx', 'utf-8');

const target = "const Header = () => {\n  const { user, signOutUser } = useAuth();\n  const {";
const replacement = "const Header = () => {\n  const { user, signOutUser } = useAuth();\n\n  const themeState = useMarketStore(s => s.theme);\n  useEffect(() => {\n    if (themeState === 'dark') {\n      document.documentElement.classList.add('dark');\n    } else {\n      document.documentElement.classList.remove('dark');\n    }\n  }, [themeState]);\n\n  const {";

appTsx = appTsx.replace(target, replacement);
fs.writeFileSync('src/App.tsx', appTsx);
