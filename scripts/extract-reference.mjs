// One-time migration tool. The standalone HTML remains the source reference.
// Refuse to overwrite an extracted application after development has begun.
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';

if (fs.existsSync('src/lab/play.js')) throw new Error('Reference already extracted. Do not overwrite subsequent work.');
const source = fs.readFileSync('UCG50_R06_Play.html', 'utf8');
const blocks = [...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)].map(m => m[1]);
if (blocks.length !== 18) throw new Error('Unexpected reference structure');
const paths = [
  'core/contracts/contract.js', 'core/course/dem.js', 'core/course/course.js',
  'core/simulation/player.js', 'core/course/wind.js', 'core/course/conditions.js',
  'core/course/terrain.js', 'core/simulation/shot.js', 'core/course/hole.js',
  'core/rendering/course-view.js', 'core/rendering/golf-presentation.js',
  'core/rendering/shot-view.js', 'lab/map-input.js', 'lab/input-trace.js',
  'core/rendering/plate-renderer.js', 'core/rendering/photo-renderer.js',
  'core/session/journey.js', 'core/session/practice.js', 'lab/play.js',
];
const split = blocks[17].indexOf('      (function () {');
if (split < 0) throw new Error('Missing lab bootstrap');
blocks.push(blocks[17].slice(split));
blocks[17] = blocks[17].slice(0, split);
const modules = [];
const owners = new Map();
function write(file, content) {
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, content);
}
function assets(text) {
  return text.replace(/data:image\/(png|jpeg|webp);base64,([A-Za-z0-9+/=]+)/g, (_, kind, encoded) => {
    const data = Buffer.from(encoded, 'base64');
    const hash = crypto.createHash('sha256').update(data).digest('hex').slice(0, 16);
    const name = `${hash}.${kind === 'jpeg' ? 'jpg' : kind}`;
    write(`public/assets/reference/${name}`, data);
    return `/assets/reference/${name}`;
  });
}
for (let i = 0; i < blocks.length; i++) {
  const exports = [];
  const references = new Set();
  let code = blocks[i].replace(/\(function \((root, factory|r, f)\) \{([\s\S]*?)\}\)\((?:globalThis|typeof globalThis !== 'undefined' \? globalThis : this), function \(/g,
    (_, signature, wrapper) => {
      const name = wrapper.match(/(?:root|r)\.(\w+)\s*=\s*(?:api|a)/)?.[1];
      if (!name) throw new Error('Unknown module wrapper');
      const call = wrapper.match(/const (?:api|a) = (?:factory|f)\(([\s\S]*?)\);/)[1];
      const dependencies = [...call.matchAll(/\b(?:root|r)\.(\w+)/g)].map(m => m[1]);
      dependencies.forEach(name => references.add(name));
      exports.push(name);
      return `const ${name} = ((factory) => factory(${dependencies.join(', ')}))(function (`;
    });
  if (i === 15) exports.push('PhotoAssets');
  if (i === 14 || i === 15) references.add('CourseView');
  if (i === 18) ['Contract', 'Course', 'Shot', 'Player', 'Wind', 'Conditions',
    'Terrain', 'CourseView', 'GolfPresentation', 'ShotView', 'MapInput',
    'PracticeVisual', 'HoleVisual', 'PhotoRenderer', 'PhotoAssets', 'InputTrace',
    'UCGJourney'].forEach(name => references.add(name));
  code = assets(code.replaceAll('globalThis.CourseView', 'CourseView'));
  for (const name of exports) owners.set(name, paths[i]);
  modules.push({ file: paths[i], code, exports, references });
}
for (const mod of modules) {
  const imports = [];
  for (const [name, owner] of owners) {
    if (owner !== mod.file && mod.references.has(name)) {
      let relative = path.posix.relative(path.posix.dirname(mod.file), owner);
      if (!relative.startsWith('.')) relative = './' + relative;
      imports.push(`import { ${name} } from '${relative}';`);
    }
  }
  write(`src/${mod.file}`, imports.join('\n') + '\n\n' + mod.code.trim() + '\n' +
    (mod.exports.length ? `\nexport { ${mod.exports.join(', ')} };\n` : ''));
}
const css = source.match(/<style>([\s\S]*?)<\/style>/)[1];
write('src/core/style/reference.css', assets(css.trim()) + '\n');
let html = source.replace(/<style>[\s\S]*?<\/style>/, '').replace(/<script\b[^>]*>[\s\S]*?<\/script>/gi, '');
html = html.replace(/<meta\s+content="default-src[^>]*http-equiv="Content-Security-Policy"\s*\/>/, '');
html = html.replace('</head>', `<meta http-equiv="Content-Security-Policy" content="default-src 'none'; script-src 'self'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self' ws://localhost:* ws://127.0.0.1:*; font-src 'none'; media-src 'none'; object-src 'none'; base-uri 'none'" />\n</head>`);
html = html.replace('</body>', '   <script type="module" src="/src/main.ts"></script>\n</body>');
write('index.html', assets(html));
console.log(`Extracted ${modules.length} JavaScript modules, stylesheet, markup and local images.`);
