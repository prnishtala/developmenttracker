/* Exports a JSON snapshot of the bundled seed (for inspection / diffing) and
 * validates basic invariants. The app imports the TypeScript seed directly, so
 * this snapshot is a convenience artifact, not a runtime dependency.
 * Run with: npm run seed:build */
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { ROUTINES } from '@/data/seed';

const ids = ROUTINES.map((r) => r.id);
const dupes = ids.filter((id, i) => ids.indexOf(id) !== i);
if (dupes.length) {
  console.error('Duplicate routine ids:', dupes);
  process.exit(1);
}

const out = join(process.cwd(), 'assets', 'routines.snapshot.json');
writeFileSync(out, JSON.stringify(ROUTINES, null, 2));
console.log(`Wrote ${ROUTINES.length} routines → ${out}`);
