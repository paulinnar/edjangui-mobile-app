import type { Locale } from '@/lib/preferences';

/**
 * Interpolation ICU réduite au strict nécessaire.
 *
 * Les catalogues sont ceux de l'app web, écrits pour `next-intl`. Deux formes
 * seulement y apparaissent : la substitution simple `{email}` et le pluriel
 * `{count, plural, =0 {…} one {…} other {…}}` avec `#` pour la valeur. Embarquer
 * une bibliothèque ICU complète pour ces deux cas coûterait plus cher en poids
 * de bundle que ces quarante lignes.
 */
export type FormatVars = Record<string, string | number>;

export function formatMessage(template: string, vars: FormatVars, locale: Locale): string {
  let out = '';
  let i = 0;

  while (i < template.length) {
    if (template[i] !== '{') {
      out += template[i];
      i += 1;
      continue;
    }

    const end = matchingBrace(template, i);
    // Accolade orpheline : on la rend telle quelle plutôt que d'avaler la fin
    // du message.
    if (end === -1) {
      out += template[i];
      i += 1;
      continue;
    }

    out += resolve(template.slice(i + 1, end), vars, locale);
    i = end + 1;
  }

  return out;
}

function matchingBrace(source: string, start: number): number {
  let depth = 0;
  for (let i = start; i < source.length; i += 1) {
    if (source[i] === '{') depth += 1;
    else if (source[i] === '}') {
      depth -= 1;
      if (depth === 0) return i;
    }
  }
  return -1;
}

function resolve(body: string, vars: FormatVars, locale: Locale): string {
  const comma = body.indexOf(',');

  if (comma === -1) {
    const value = vars[body.trim()];
    return value === undefined ? '' : String(value);
  }

  const name = body.slice(0, comma).trim();
  const rest = body.slice(comma + 1).trim();
  const value = vars[name];

  if (!rest.startsWith('plural')) {
    // `{amount, number}` et consorts : le formatage des nombres et des dates se
    // fait en amont, à l'appel, avec la devise de la tontine.
    return value === undefined ? '' : String(value);
  }

  const count = Number(value ?? 0);
  const branches = parseBranches(rest.slice('plural'.length).replace(/^\s*,\s*/, ''));
  const chosen = branches[`=${count}`] ?? branches[pluralCategory(count, locale)] ?? branches.other;

  if (chosen === undefined) return '';
  return formatMessage(chosen.split('#').join(String(count)), vars, locale);
}

function parseBranches(source: string): Record<string, string> {
  const branches: Record<string, string> = {};
  let i = 0;

  while (i < source.length) {
    while (i < source.length && /\s/.test(source[i])) i += 1;

    const open = source.indexOf('{', i);
    if (open === -1) break;

    const key = source.slice(i, open).trim();
    const close = matchingBrace(source, open);
    if (close === -1) break;

    branches[key] = source.slice(open + 1, close);
    i = close + 1;
  }

  return branches;
}

/** En français, 0 et 1 prennent le singulier ; en anglais, seul 1. */
function pluralCategory(count: number, locale: Locale): 'one' | 'other' {
  if (locale === 'fr') return count < 2 ? 'one' : 'other';
  return count === 1 ? 'one' : 'other';
}
