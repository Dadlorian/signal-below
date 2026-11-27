// Cloudflare Worker: a permanent address (for example kaggle.gamelab.link) in front of the
// temporary address that Kaggle gives each run. It holds NO secret: start.ps1 writes the current
// temporary address into the KV entry "upstream" after the AI is READY, and clears it on stop.
// Your Cline key is still checked by the AI itself; this only passes requests along.
// Only /v1/... is forwarded, and only to a https://<name>.trycloudflare.com address.

const ALLOWED_UPSTREAM = /^https:\/\/[a-z0-9-]+\.trycloudflare\.com$/;
const DROP = ['host', 'cf-connecting-ip', 'cf-ipcountry', 'cf-ray', 'cf-visitor', 'cf-worker',
  'x-forwarded-for', 'x-forwarded-proto', 'x-real-ip'];

function reply(status, message) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { 'content-type': 'application/json' } });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (!url.pathname.startsWith('/v1/')) return reply(404, 'not found');

    const upstream = ((await env.KC.get('upstream', { cacheTtl: 30 })) || '').trim();
    if (!ALLOWED_UPSTREAM.test(upstream)) return reply(503, 'The AI is not running. Start it with start.cmd.');

    const headers = new Headers(request.headers);
    for (const name of DROP) headers.delete(name);

    let response;
    try {
      response = await fetch(upstream + url.pathname + url.search, {
        method: request.method,
        headers,
        body: (request.method === 'GET' || request.method === 'HEAD') ? undefined : request.body,
        redirect: 'manual',
      });
    } catch (e) {
      return reply(503, 'The AI did not answer. It may have stopped or is still starting.');
    }
    // A stopped quick tunnel answers with a Cloudflare error, not with our server.
    if (response.status === 530 || response.status === 1033) {
      return reply(503, 'The AI is not running. Start it with start.cmd.');
    }
    return new Response(response.body, { status: response.status, headers: response.headers });
  },
};
