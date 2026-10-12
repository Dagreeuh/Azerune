// Assemble le sim en un seul fichier HTML autonome (ouvrable en double-cliquant).
// Usage : node scripts/build.js [--fragment chemin.html]
//   --fragment : écrit en plus une version sans <!doctype>/<head>/<body> (pour l’hébergement en Artifact).

import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const read = (p) => readFileSync(join(root, p), 'utf8');

const MODULES = ['src/data.js', 'src/itemdb.js', 'src/gear.js', 'src/engine.js', 'src/ui/dom.js', 'src/ui/charts.js', 'src/app.js'];

function stripModule(code) {
  return code
    .replace(/^import\s*\{[\s\S]*?\}\s*from\s*'[^']+';\s*$/gm, '')
    .replace(/^export\s+(?=(const|let|function|async|class)\b)/gm, '');
}

function topLevelNames(code) {
  const names = [];
  const re = /^(?:const|let|function|async function|class)\s+([A-Za-z_$][\w$]*)/gm;
  let m;
  while ((m = re.exec(code))) names.push(m[1]);
  return names;
}

const parts = MODULES.map((file) => ({ file, code: stripModule(read(file)) }));
const seen = new Map();
for (const { file, code } of parts) {
  for (const name of topLevelNames(code)) {
    if (seen.has(name)) throw new Error(`Nom en double « ${name} » dans ${seen.get(name)} et ${file}`);
    seen.set(name, file);
  }
}
const bundle = parts.map(({ file, code }) => `// ---- ${file} ----\n${code.trim()}\n`).join('\n');

const html = read('index.html');
const title = html.match(/<title>[\s\S]*?<\/title>/)[0];
const fonts = html.match(/<link rel="preconnect"[\s\S]*?display=swap">/)[0];
const body = html.match(/<!-- BODY:START -->([\s\S]*?)<!-- BODY:END -->/)[1].trim();
const css = read('src/styles.css').trim();

const head = `${title}\n${fonts}\n<style>\n${css}\n</style>`;
const script = `<script type="module">\n${bundle}</script>`;

const full = `<!doctype html>
<html lang="fr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
${head}
</head>
<body>
${body}
${script}
</body>
</html>
`;

mkdirSync(join(root, 'dist'), { recursive: true });
writeFileSync(join(root, 'dist/sim-survie-forever.html'), full);
console.log('dist/sim-survie-forever.html');

const i = process.argv.indexOf('--fragment');
if (i > -1 && process.argv[i + 1]) {
  writeFileSync(process.argv[i + 1], `${head}\n${body}\n${script}\n`);
  console.log(process.argv[i + 1]);
}
