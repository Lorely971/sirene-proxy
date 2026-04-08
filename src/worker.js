// ═══════════════════════════════════════════════════════════════
// PLACIDOM CRM — Proxy INSEE SIRET
// Cloudflare Worker à déployer séparément
//
// DÉPLOIEMENT :
// 1. Va sur dash.cloudflare.com → Workers & Pages → Create Worker
// 2. Nomme-le "sirene-proxy"
// 3. Colle ce code → Save & Deploy
// 4. Ton URL sera : https://sirene-proxy.{subdomain}.workers.dev
// 5. Dans le CRM → Paramètres → colle cette URL dans "URL Proxy SIRET"
// ═══════════════════════════════════════════════════════════════

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    const path = url.pathname;

    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    const match = path.match(/\/siret\/(\d{14})/);
    if (!match) {
      return new Response(JSON.stringify({ error: 'Fournir un SIRET à 14 chiffres : /siret/12345678901234' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const siret = match[1];

    try {
      const apiUrl = `https://recherche-entreprises.api.gouv.fr/search?q=${siret}&page=1&per_page=1`;
      const apiRes = await fetch(apiUrl, { headers: { 'Accept': 'application/json' } });

      if (!apiRes.ok) {
        return new Response(JSON.stringify({ error: 'API INSEE indisponible', status: apiRes.status }), {
          status: apiRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const data = await apiRes.json();

      return new Response(JSON.stringify(data), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=3600',
        },
      });

    } catch (e) {
      return new Response(JSON.stringify({ error: e.message }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  },
};
