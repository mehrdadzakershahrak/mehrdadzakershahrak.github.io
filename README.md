# mehrdadzaker.com (GitHub Pages)

This repo is now a static marketing and guidance surface only. The live LLM Wiki product, authentication flow, viewer, and MCP endpoints live on [idx.mehrdadzaker.com](https://idx.mehrdadzaker.com).

## Production surface
- Public guidance and marketing pages remain on `www.mehrdadzaker.com`.
- `/idx/assistant/` is the public IDX landing page.
- `/idx/dashboard/` is a thin redirect/handoff page to `https://idx.mehrdadzaker.com/v2/portal`.
- `/login/` redirects to `https://idx.mehrdadzaker.com/auth/login`.
- The website no longer gates access with its own auth flow for the v2 product.

## Local development
This repo expects `ruby 3.2.11` from `.ruby-version` and `bundler 4.0.7`. Using macOS system Ruby `2.6.x` will not work with the current Bundler lock.

If you use `rbenv`, bootstrap the local toolchain with:

```bash
cd /Users/mehrdad/Downloads/mehrdadzakershahrak.github.io
PATH="/opt/homebrew/bin:$PATH" rbenv install -s "$(cat .ruby-version)"
PATH="/opt/homebrew/bin:$PATH" rbenv local "$(cat .ruby-version)"
gem install bundler -v 4.0.7
bundle _4.0.7_ install
```

Then run Jekyll locally:

```bash
cd /Users/mehrdad/Downloads/mehrdadzakershahrak.github.io
bundle _4.0.7_ exec jekyll serve --host 127.0.0.1 --port 4000
```

## Website E2E
The website Playwright suite validates the static v2 handoff contract:
- `/idx/dashboard/` renders the wrapper and redirects directly to the product host
- legacy query params are ignored
- `/login/` redirects directly to product-domain auth
- `/idx/assistant/` stays a public IDX landing page with the current CTA contract

Run the suite:

```bash
cd /Users/mehrdad/Downloads/mehrdadzakershahrak.github.io
PATH="/opt/homebrew/bin:$PATH" npm install
PATH="/opt/homebrew/bin:$PATH" npx playwright install chromium
PATH="/opt/homebrew/bin:$PATH" npm run test:e2e
```

## Notes
- Product implementation work belongs in [neuralint-platform](/Users/mehrdad/Downloads/neuralint-platform).
- If public copy on this site mentions a website-hosted dashboard or website-hosted sign-in, that copy is stale and should be updated to point to `idx.mehrdadzaker.com`.
- The static site no longer carries the legacy auth-service, auth-link, or demo-chat runtime. IDX sign-in and authenticated product access live on `idx.mehrdadzaker.com`.
