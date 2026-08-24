# mehrdadzaker.com

Personal website for Mehrdad Zaker. The site is intentionally small: home, work, research, writing, about, and contact.

## Production Surface

- `/` presents the minimalist personal profile.
- `/work/` contains selected, CV-grounded work and research.
- `/research/` presents five illustrated research programs with selected publication links.
- `/newsletter/` and `/newsletter/archive/` contain writing.
- `/about/` contains the current biography, experience, research evidence, education, and technical focus.
- `/contact/` is the direct contact path.

The site no longer publishes product catalogue, login, search, or product-specific routes.

## Local Development

This repo expects `ruby 3.2.11` from `.ruby-version` and `bundler 4.0.7`.

```bash
PATH="/opt/homebrew/bin:$PATH" rbenv install -s "$(cat .ruby-version)"
PATH="/opt/homebrew/bin:$PATH" rbenv local "$(cat .ruby-version)"
gem install bundler -v 4.0.7
bundle _4.0.7_ install
```

Run Jekyll locally:

```bash
bundle _4.0.7_ exec jekyll serve --host 127.0.0.1 --port 4000
```

## Content

Written AI material lives in `_ai_material/`. Use this collection for guides, notes, explainers, and references. Preserve public URLs with explicit `permalink` values.

Required front matter for AI material:

- `title`, `description`, `excerpt`, `permalink`
- `date`, `last_modified_at`, `author`
- `content_type`: `guide`, `note`, `reference`, or `explainer`
- `audience`, `topics`
- `image_alt` when `image` is set

Images are optional. Prefer minimal imagery: use a final asset when it materially helps the page, or use a restrained editorial placeholder.

## E2E

```bash
PATH="/opt/homebrew/bin:$PATH" npm install
PATH="/opt/homebrew/bin:$PATH" npx playwright install chromium
PATH="/opt/homebrew/bin:$PATH" npm run test:e2e
```

The tests should cover the simplified primary routes, navigation, homepage sections, and removal of retired product/login/search surfaces.
