/**
 * Recopie de l'app web ce que le mobile doit refléter à l'identique : les
 * catalogues de traduction et le contrat de l'API.
 *
 * L'app web est la source des deux. Les libellés, parce que les deux clients
 * disent la même chose ; le contrat, parce qu'une divergence de forme doit être
 * une erreur de compilation et non un écran vide à l'exécution.
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

const contract = join(webRepo, 'src', 'lib', 'api', 'contract.ts');
if (existsSync(contract)) {
  copyFileSync(contract, join(import.meta.dirname, '..', 'src', 'lib', 'api', 'contract.ts'));
  console.log('✓ api/contract.ts');
}
