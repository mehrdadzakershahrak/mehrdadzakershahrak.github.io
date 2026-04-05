# mehrdadzaker.com (GitHub Pages)

This repo is now a static marketing and guidance surface only. The live LLM Wiki product, authentication flow, viewer, and MCP endpoints live on [idx.mehrdadzaker.com](https://idx.mehrdadzaker.com).

## Production surface
- Public guidance and marketing pages remain on `www.mehrdadzaker.com`.
- `/idx/assistant/` is a public explanation page.
- `/idx/dashboard/` is a thin redirect/handoff page to `https://idx.mehrdadzaker.com/v2/portal`.
- `/login/` redirects to `https://idx.mehrdadzaker.com/auth/login`.
- The website no longer gates access with its own auth flow for the v2 product.

## Local development
Run Jekyll locally:

```bash
cd /Users/mehrdad/Downloads/mehrdadzakershahrak.github.io
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

## Website E2E
The website Playwright suite validates the static v2 handoff contract:
- `/idx/dashboard/` renders the wrapper and redirects directly to the product host
- legacy query params are ignored
- `/login/` redirects directly to product-domain auth

Run the suite:

```bash
cd /Users/mehrdad/Downloads/mehrdadzakershahrak.github.io
PATH="/opt/homebrew/bin:$PATH" npm install
PATH="/opt/homebrew/bin:$PATH" npm run test:e2e
```

## Notes
- Product implementation work belongs in [neuralint-platform](/Users/mehrdad/Downloads/neuralint-platform).
- If public copy on this site mentions a website-hosted dashboard or website-hosted sign-in, that copy is stale and should be updated to point to `idx.mehrdadzaker.com`.
