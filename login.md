---
layout: single
title: "Login"
permalink: /login/
classes: wide
---

Use your Google account to sign in to the IDX website dashboard on this site. After sign-in, you will be returned to the page you requested or sent to the dashboard. This page is for the credentialed website flow, not the public Industry Guidance page and not the separate ChatGPT/MCP backend at `https://idx.mehrdadzaker.com`.

<div
  class="mdz-auth-panel"
  data-google-login
>
  <h2>Sign in with Google</h2>
  <p class="mdz-auth-panel__copy">
    This sign-in is for the secure website dashboard surface of IDX on this site. On localhost, the page also offers a local preview path when the auth or IDX services are not running.
  </p>
  <div class="mdz-auth-panel__button" data-google-login-button></div>
  <p class="mdz-auth-panel__status" data-google-login-msg>Checking sign-in status…</p>
</div>

After you sign in, open the [IDX Dashboard]({{ '/idx/dashboard/' | relative_url }}) or browse [Industry Guidance]({{ '/idx/assistant/' | relative_url }}). If you want to test or use IDX with ChatGPT through MCP, use [`https://idx.mehrdadzaker.com`](https://idx.mehrdadzaker.com) rather than this website login flow. If you need help with that setup, [contact Mehrdad]({{ '/contact/' | relative_url }}).
