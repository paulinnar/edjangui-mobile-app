/**
 * Applique une opacité à une couleur du thème.
 *
 * React Native accepte le `#rrggbbaa`, mais les valeurs de `theme.ts` sont
 * écrites en six chiffres : cette fonction ajoute — ou remplace — le canal
 * alpha sans avoir à dupliquer chaque teinte dans la palette.
 */
export function withAlpha(hex: string, alpha: number): string {
  const base = hex.slice(0, 7);
  const channel = Math.round(Math.min(Math.max(alpha, 0), 1) * 255)
    .toString(16)
    .padStart(2, '0');
  return `${base}${channel}`;
}
