# mehrdadzaker.com (GitHub Pages)

## Configure auth + demo chat
Edit `_config.yml`:

- `auth_api_base_url`: base URL for the dedicated auth service, for example `https://auth.mehrdadzaker.com`.
- `google_client_id`: Google OAuth Web Client ID used by Google Identity Services on `/login/`.
- `logo_mark`: logo path used in masthead/home/footer branding.
- `demo_chat_endpoints.*`: optional legacy values. The static frontend no longer calls them directly once auth is enabled; the auth service should route chat server-side.
- `substack_subscribe_url`: your Substack subscribe URL (optional).
- `leads_endpoint` and `turnstile_site_key`: legacy/optional values retained in config, but no longer used by login or demo access control.

### Expected frontend auth flow
1. `/login/` renders the Google sign-in button using `google_client_id`.
2. Google returns an ID token (`credential`) to the browser.
3. The browser posts that credential to `POST {auth_api_base_url}/auth/google`.
4. The auth service verifies the token with Google and sets an `mdz_session` cookie.
5. Demo pages call `GET {auth_api_base_url}/auth/session` to decide whether to unlock chat.
6. Demo chat posts to `POST {auth_api_base_url}/api/demo-chat` with `credentials: include`.

### Auth backend contract
**Google sign-in**
```json
{
  "credential": "<google-id-token>"
}
```

`POST /auth/google`
- Verify Google ID token
- Require `email_verified = true`
- Upsert user by Google subject (`sub`)
- Set cookie `mdz_session`
- Return:

```json
{
  "authenticated": true,
  "user": {
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://..."
  }
}
```

`GET /auth/session`
```json
{
  "authenticated": true,
  "user": {
    "email": "user@example.com",
    "name": "User Name",
    "picture": "https://..."
  }
}
```

`POST /auth/logout`
- Clear the session cookie

`POST /api/demo-chat`
```json
{
  "demo_id": "legal|finance|real_estate|healthcare|education|research|revenue_operations",
  "message": "hello",
  "pageContext": {
    "url": "https://...",
    "title": "..."
  }
}
```

### Session defaults
- Cookie name: `mdz_session`
- `HttpOnly`, `Secure`, `SameSite=Lax`
- `Domain=.mehrdadzaker.com` in production
- Host-only cookie in local development
- All frontend auth/chat requests use `credentials: include`

## Auth service in this repo
The missing backend now lives in [auth-service/server.js](/Users/mehrdad/Downloads/mehrdadzakershahrak.github.io/auth-service/server.js).

It implements:
- `GET /health`
- `GET /auth/session`
- `POST /auth/google`
- `POST /auth/logout`
- `POST /api/demo-chat`

### Auth service environment
Copy [auth-service/.env.example](/Users/mehrdad/Downloads/mehrdadzakershahrak.github.io/auth-service/.env.example) to `auth-service/.env` and fill in:

- `GOOGLE_CLIENT_ID`
- `SESSION_SECRET`
- `ALLOWED_ORIGINS`
- `DEMO_CHAT_ENDPOINTS_JSON` if you want real demo upstream routing

In local development, the frontend automatically uses:
- `http://127.0.0.1:8787` when the site runs on `127.0.0.1`
- `http://localhost:8787` when the site runs on `localhost`

That means you can keep production `auth_api_base_url` in `_config.yml` and still test locally.

## Google Cloud setup
### 1. Create the project
- Open Google Cloud Console
- Create or choose the project for `mehrdadzaker.com` auth

### 2. Configure OAuth consent screen
- Go to `APIs & Services` -> `OAuth consent screen`
- User type: `External`
- Fill in:
  - App name
  - User support email
  - Developer contact email
- Add authorized domain: `mehrdadzaker.com`
- Scopes: `openid`, `email`, `profile`
- While testing, add your intended login accounts as test users
- Publish the app when you are ready for public sign-in

### 3. Create the OAuth client
- Go to `Google Auth Platform` -> `Clients`
- Create credential -> `OAuth client ID`
- Application type: `Web application`
- Authorized JavaScript origins:
  - `https://www.mehrdadzaker.com`
  - `https://mehrdadzaker.com`
  - `http://127.0.0.1:4000`
  - `http://localhost:4000`
- Redirect URIs: none required for the current Google Identity Services button callback flow

Copy the generated client ID into `_config.yml` as:
```yaml
google_client_id: "YOUR_GOOGLE_WEB_CLIENT_ID"
```

## Backend verification checklist
- Verify the token audience equals `google_client_id`
- Accept only Google issuers
- Require `email_verified = true`
- Persist at least:
  - `google_sub`
  - `email`
  - `name`
  - `picture`

## Local development
This repo is set up for GitHub Pages, but local Jekyll builds require a modern Ruby toolchain (Ruby 3.x recommended).

Run locally:
```bash
cd /Users/mehrdad/Downloads/mehrdadzakershahrak.github.io
bundle install
bundle exec jekyll serve --host 127.0.0.1 --port 4000
```

Run the auth service in another terminal:
```bash
cd /Users/mehrdad/Downloads/mehrdadzakershahrak.github.io/auth-service
npm install
cp .env.example .env
# edit .env and set GOOGLE_CLIENT_ID + SESSION_SECRET
npm run dev
```

Verify it is up:
```bash
curl http://127.0.0.1:8787/health
```

For Google sign-in to work locally, your Google Cloud OAuth client must include:
- `http://127.0.0.1:4000`
- `http://localhost:4000`

If you see `[GSI_LOGGER]: The given origin is not allowed for the given client ID`, the fix is in Google Cloud, not in this repo: edit the existing Web client and add the exact local origin you are using.

If you see `ERR_NAME_NOT_RESOLVED` for `auth.mehrdadzaker.com` during local development, the auth service is not running locally yet or you opened an old build before the local auth fallback JavaScript was loaded.

## Deploy the auth service
The auth service includes a production container at [auth-service/Dockerfile](/Users/mehrdad/Downloads/mehrdadzakershahrak.github.io/auth-service/Dockerfile). The simplest deployment target is Cloud Run.

### Recommended production path
1. Create a DNS record for `auth.mehrdadzaker.com`
2. Deploy the container to Cloud Run
3. Point the custom domain at the Cloud Run service
4. Set production environment variables:
   - `GOOGLE_CLIENT_ID`
   - `SESSION_SECRET`
   - `COOKIE_DOMAIN=.mehrdadzaker.com`
   - `COOKIE_SECURE=true`
   - `ALLOWED_ORIGINS=https://www.mehrdadzaker.com,https://mehrdadzaker.com`
   - `DEMO_CHAT_ENDPOINTS_JSON=...`

### Example Cloud Run commands
```bash
cd /Users/mehrdad/Downloads/mehrdadzakershahrak.github.io/auth-service

gcloud builds submit --tag us-central1-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/mehrdadzaker-auth

gcloud run deploy mehrdadzaker-auth \
  --image us-central1-docker.pkg.dev/YOUR_PROJECT/YOUR_REPO/mehrdadzaker-auth \
  --region us-central1 \
  --allow-unauthenticated \
  --set-env-vars GOOGLE_CLIENT_ID=YOUR_GOOGLE_WEB_CLIENT_ID.apps.googleusercontent.com \
  --set-env-vars SESSION_SECRET=YOUR_LONG_RANDOM_SECRET \
  --set-env-vars COOKIE_DOMAIN=.mehrdadzaker.com \
  --set-env-vars COOKIE_SECURE=true \
  --set-env-vars ALLOWED_ORIGINS=https://www.mehrdadzaker.com,https://mehrdadzaker.com \
  --set-env-vars DEMO_CHAT_ENDPOINTS_JSON='{"legal":"https://...","finance":"https://..."}'
```
