// Cloudflare Worker proxy: forwards incoming requests to your backend.
// Set the BACKEND_URL secret in Cloudflare (or use the default below).

const DEFAULT_BACKEND = "https://backend.g-s-kavinayan.workers.dev";

export default {
  async fetch(request, env) {
    // Handle CORS preflight quickly
    if (request.method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type,Authorization",
        },
      });
    }

    const backend = (env && env.BACKEND_URL) || DEFAULT_BACKEND;
    const url = new URL(request.url);
    const path = url.pathname + url.search;
    const target = backend.replace(/\/$/, "") + path;

    const init = {
      method: request.method,
      headers: request.headers,
      body: ["GET", "HEAD"].includes(request.method) ? null : request.body,
      redirect: "manual",
    };

    const resp = await fetch(target, init);

    // Copy response, add CORS headers so browser can call Worker directly
    const headers = new Headers(resp.headers);
    headers.set("Access-Control-Allow-Origin", "*");
    headers.set("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
    headers.set("Access-Control-Allow-Headers", "Content-Type,Authorization");

    return new Response(resp.body, { status: resp.status, headers });
  },

  // Optional scheduled handler (used if you add cron triggers in wrangler.toml)
  async scheduled(event, env, ctx) {
    try {
      const backend = env.BACKEND_URL || DEFAULT_BACKEND;
      await fetch(backend + "/"); // simple health poke
    } catch (e) {
      console.error("Scheduled health check failed", e);
    }
  },
};
