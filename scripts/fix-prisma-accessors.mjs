import fs from 'node:fs';
import path from 'node:path';

const ROOT = path.join(process.cwd(), 'api', 'src');
const SKIP = new Set(['node_modules', 'dist']);
const reps = [
  ['academyTrainingSupportOfficer', 'academyTrainingSupportStaff'],
  ['officerDepartment', 'staffDepartment'],
  ['officerDecoration', 'staffDecoration'],
  ['officerLicense', 'staffLicense'],
  // Prisma relation counts / includes renamed on models
  ['select: { officers: true }', 'select: { staffProfiles: true }'],
  ['select: { officers: true, supervisors: true }', 'select: { staffProfiles: true, supervisors: true }'],
  ['officers: true,', 'staffProfiles: true,'],
  ['officers: {', 'staffProfiles: {'],
  ['officers: true }', 'staffProfiles: true }'],
  ['_count.officers', '_count.staffProfiles'],
  ['_count: { select: { officers: true } }', '_count: { select: { staffProfiles: true } }'],
];

function walk(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (SKIP.has(entry.name)) continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, acc);
    else if (full.endsWith('.ts')) acc.push(full);
  }
  return acc;
}

let n = 0;
for (const file of walk(ROOT)) {
  let c = fs.readFileSync(file, 'utf8');
  let x = c;
  for (const [a, b] of reps) x = x.split(a).join(b);
  if (x !== c) {
    fs.writeFileSync(file, x);
    n++;
    console.log(path.relative(process.cwd(), file));
  }
}
console.log(`updated ${n} files`);
