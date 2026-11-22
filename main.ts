// VAULT 13 — hand-in program (Node 22, standard library only).
//
// The game itself is the static site in game/ (open game/index.html in a
// browser and play; there is no build step). This program hands the entry in:
// it copies game/ and screenshots/ from beside this file into the output
// directory and writes dossier.json there with buildDossier from
// vendor/makefun-game.ts, the kit's library, so the dossier is byte for byte
// the one the scorer rebuilds from the same files.
//
// Every path is resolved from this file's own directory, never from the
// caller's working directory. Outside the grader's container,
// MAKEFUN_OUTPUT_DIR stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy a directory into the output, replacing whatever an earlier run left
// there. The plain copy fails when the earlier hand-in's files are read-only
// (a grader may snapshot them that way), so the old tree is removed first —
// removing a file only needs its directory writable, never the file itself.
function copyInto(source, destination) {
  rmSync(destination, { recursive: true, force: true });
  cpSync(source, destination, { recursive: true });
}

mkdirSync(out, { recursive: true });
copyInto(join(here, 'game'), join(out, 'game'));
mkdirSync(join(out, 'screenshots'), { recursive: true });
if (existsSync(join(here, 'screenshots'))) {
  copyInto(join(here, 'screenshots'), join(out, 'screenshots'));
}

// The caps are the scorer's own (the gate's gate.json): only text_max_bytes
// shapes the dossier bytes; the rest make this program refuse an entry the
// scorer would refuse anyway (more than 4 screenshots or one over 256 KiB,
// more than 993 files or 48 MiB under game/, a game path over 1000 bytes).
// An earlier run's dossier.json is removed before writing, for the same
// read-only reason as the copies above.
rmSync(join(out, 'dossier.json'), { force: true });
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, {
    text_max_bytes: 163840,
    screenshots: { max: 4, max_bytes: 262144 },
    game_max_files: 993,
    game_max_bytes: 50331648,
    game_path_max_bytes: 1000,
  }),
);
