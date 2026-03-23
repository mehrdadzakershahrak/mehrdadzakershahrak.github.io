# mehrdadzaker.com (GitHub Pages)

## Configure demo chat + lead capture
Edit `_config.yml`:

- `leads_endpoint`: your API endpoint that stores captured emails (POST JSON).
- `turnstile_site_key`: Cloudflare Turnstile site key (optional but recommended).
- `logo_mark`: logo path used in masthead/home/footer branding.
- `demo_chat_endpoints.legal|finance|real_estate|healthcare|education|research|revenue_operations`: per-demo chat endpoints (POST JSON).
- `substack_subscribe_url`: your Substack subscribe URL (optional).

### Expected request payloads
**Lead capture** (`leads_endpoint`)
```json
{
  "email": "user@example.com",
  "source": "demo_gate|login",
  "demo": "legal|finance|real_estate",
  "pageUrl": "https://...",
  "ts": "2026-03-04T00:00:00.000Z",
  "newsletterOptIn": true,
  "turnstileToken": "..."
}
```

**Chat** (each `demo_chat_endpoints.*`)
```json
{
  "message": "hello",
  "demo_id": "legal|finance|real_estate",
  "email": "user@example.com",
  "pageContext": { "url": "https://...", "title": "..." },
  "turnstileToken": "..."
}
```

## Local development
This repo is set up for GitHub Pages, but local Jekyll builds require a modern Ruby toolchain (Ruby 3.x recommended).
