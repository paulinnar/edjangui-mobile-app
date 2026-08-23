/**
 * Recopie les catalogues de traduction de l'app web dans le mobile.
 *
 * Les deux clients affichent les mêmes libellés ; l'app web reste la source.
 * `next-intl` ne tourne pas sous React Native, mais le format des fichiers est
 * du JSON ICU standard, lu tel quel par `src/i18n/index.tsx`.
 *
 *   node scripts/sync-messages.mjs [chemin-du-repo-web]
 */
import { copyFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';

const webRepo = resolve(
  process.argv[2] ?? join(import.meta.dirname, '..', '..', 'edjangui-app'),
);
const source = join(webRepo, 'src', 'i18n', 'messages');

if (!existsSync(source)) {
  console.error(`Catalogues introuvables : ${source}`);
  process.exit(1);
}

for (const file of ['fr.json', 'en.json']) {
  copyFileSync(join(source, file), join(import.meta.dirname, '..', 'src', 'i18n', 'messages', file));
  console.log(`✓ ${file}`);
}
