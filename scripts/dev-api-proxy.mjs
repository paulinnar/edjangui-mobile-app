/**
 * Relais de développement vers l'API de l'app web, avec les en-têtes CORS.
 *
 * **Uniquement pour l'aperçu web.** Sur Android et iOS il n'y a pas de CORS :
 * l'app appelle `EXPO_PUBLIC_API_URL` directement et ce script n'a aucune
 * raison de tourner. Mais en aperçu web, la page vient du serveur Expo
 * (`localhost:8081`) et l'API répond ailleurs (`localhost:3000`) : deux
 * origines, donc un blocage du navigateur sur chaque appel.
 *
 * Le relais existe ici plutôt que sous forme d'en-têtes CORS côté API parce que
 * la gêne est un artefact de l'aperçu, pas un besoin du produit : ouvrir l'API
 * aux origines d'un navigateur pour le confort d'un outil de développement
 * serait payer en surface d'exposition un problème qui n'existe pas sur la
 * cible.
 *
 *   node scripts/dev-api-proxy.mjs [url-de-l-app-web] [port]
 *
 * puis, dans `.env` :
 *
 *   EXPO_PUBLIC_API_URL="http://localhost:3001"
 */
import { createServer } from 'node:http';

const UPSTREAM = (process.argv[2] ?? 'http://127.0.0.1:3000').replace(/\/+$/, '');
const PORT = Number(process.argv[3] ?? 3001);

/**
 * Les appels portent `Authorization`, ce qui en fait des requêtes « non
 * simples » : le navigateur envoie d'abord un OPTIONS et n'émet la vraie
 * requête que si la réponse l'autorise.
 */
const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
  'Access-Control-Allow-Headers': 'Authorization, Content-Type',
  'Access-Control-Max-Age': '86400',
};

createServer(async (request, response) => {
  if (request.method === 'OPTIONS') {
    response.writeHead(204, CORS);
    response.end();
    return;
  }

  const chunks = [];
  for await (const chunk of request) chunks.push(chunk);

  try {
    const upstream = await fetch(UPSTREAM + request.url, {
      method: request.method,
      // `host` est retiré : le laisser ferait arriver la requête chez Next avec
      // l'en-tête du relais, ce qui fausse la reconstruction d'URL absolue.
      headers: { ...request.headers, host: new URL(UPSTREAM).host },
      body: chunks.length > 0 ? Buffer.concat(chunks) : undefined,
    });

    response.writeHead(upstream.status, {
      ...CORS,
      'Content-Type': upstream.headers.get('content-type') ?? 'application/octet-stream',
    });
    response.end(Buffer.from(await upstream.arrayBuffer()));
  } catch {
    // L'app web n'est pas lancée : on rend la forme d'erreur du contrat, pour
    // que le client affiche son message plutôt qu'une page HTML de proxy.
    response.writeHead(502, { ...CORS, 'Content-Type': 'application/json' });
    response.end(
      JSON.stringify({ error: { code: 'server_error', messageKey: 'common.errors.unexpected' } }),
    );
  }
}).listen(PORT, () => {
  console.log(`Relais CORS : http://localhost:${PORT} -> ${UPSTREAM}`);
  console.log(`Renseignez EXPO_PUBLIC_API_URL="http://localhost:${PORT}" dans .env`);
});
