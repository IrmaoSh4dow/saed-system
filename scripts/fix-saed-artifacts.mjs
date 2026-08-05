import fs from 'node:fs';
import path from 'node:path';

const ROOT = process.cwd();
const SKIP = new Set(['node_modules', 'dist', 'coverage', '.git', 'uploads', 'dumps', 'migrations']);
const EXT = new Set(['.ts', '.js', '.prisma', '.md', '.mdc', '.json', '.yml', '.html', '.example']);

const reps = [
  ['Departmentes', 'Departamentos'],
  ['isLspdCharacter', 'isSaedCharacter'],
  ["@Controller('officers')", "@Controller('staff')"],
  ['@Controller("officers")', '@Controller("staff")'],
  ["@Controller('divisions')", "@Controller('departments')"],
  ['officersService', 'staffService'],
  ['divisionsService', 'departmentsService'],
  ['ReportType.INCIDENT', 'ReportType.CONSULTATION'],
  ["'INCIDENT'", "'CONSULTATION'"],
  ['CharacterStatus.OFFICER', 'CharacterStatus.MEDICAL_STAFF'],
  ['CharacterStatus.CADET', 'CharacterStatus.INTERN'],
];

function walk(dir, acc = []) {
  if (!fs.existsSync(dir)) return acc;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else acc.push(full);
  }
  return acc;
}

let files = [
  ...walk(path.join(ROOT, 'api')),
  ...walk(path.join(ROOT, 'web')),
  ...walk(path.join(ROOT, 'docs')),
  ...walk(path.join(ROOT, '.cursor')),
  ...walk(path.join(ROOT, 'database')),
];
for (const r of ['package.json', 'README.md', '.env.example']) {
  const full = path.join(ROOT, r);
  if (fs.existsSync(full)) files.push(full);
}

let changed = 0;
for (const file of files) {
  const ext = path.extname(file).toLowerCase();
  if (!EXT.has(ext) && !file.endsWith('.env.example')) continue;
  let content = fs.readFileSync(file, 'utf8');
  let next = content;
  for (const [from, to] of reps) {
    if (next.includes(from)) next = next.split(from).join(to);
  }
  if (next !== content) {
    fs.writeFileSync(file, next);
    changed += 1;
  }
}
console.log(`fixed ${changed} files`);
