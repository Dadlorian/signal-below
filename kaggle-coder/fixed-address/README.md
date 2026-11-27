# Fixed address (optional): kaggle.gamelab.link

Without this, start.cmd uses Kaggle's free temporary address and you paste it into Cline each run.
With it, Cline's Base URL never changes. If anything here is not set up, or does not work on a given run,
start.cmd quietly uses the temporary address as before.

Nothing here touches the tunnel that serves signal.gamelab.link. No Cloudflare secret goes to Kaggle.

## One-time setup in the Cloudflare dashboard (Corey, about 10 minutes)
1. **KV store:** Storage & Databases > KV > Create a namespace, name it `kaggle-coder`. Copy its **Namespace ID**.
2. **Worker:** Workers & Pages > Create > Worker, name it `kaggle-coder`, Deploy, then Edit code, paste all of
   `worker.js` from this folder, Deploy.
3. **Connect the store:** the Worker > Settings > Bindings > Add > KV namespace. Variable name **`KC`**, pick `kaggle-coder`.
4. **Address:** the Worker > Settings > Domains & Routes > Add > Custom domain > `kaggle.gamelab.link`
   (the domain must be on your Cloudflare account).
5. **Limited token:** My Profile > API Tokens > Create Token > Custom token. One permission only:
   **Account > Workers KV Storage > Edit**, for your account only. Copy the token (shown once).
   Your **Account ID** is on the right of the Workers & Pages overview.
6. On the laptop that runs the AI, double-click **`fixed-address.cmd`**. Paste the host, Account ID,
   Namespace ID and token when asked (the token stays hidden). It saves them in
   `kaggle-coder\.env` (git ignores it; it is never sent to Kaggle) and tests the Worker.

## Optional hardening in the dashboard
- Security > WAF > Rate limiting rule for `kaggle.gamelab.link`.
- If the token ever leaks: delete it in the dashboard and make a new one. It can only write that one store.

## Not yet verified on a real run
- Whether a Worker can fetch a `trycloudflare.com` address (Cloudflare sometimes blocks Worker-to-Cloudflare
  requests). If it cannot, every start falls back to the temporary address and nothing breaks.
- Streaming of long replies through the Worker, and the free-plan limits.
- Changes to the stored address can take up to about a minute to reach every Cloudflare location.
