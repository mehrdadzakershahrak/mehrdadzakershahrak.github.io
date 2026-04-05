---
layout: single
title: "Login"
permalink: /login/
classes: wide
---

<script>
  window.location.replace("https://idx.mehrdadzaker.com/auth/login?return_to=https%3A%2F%2Fidx.mehrdadzaker.com%2Fv2%2Fportal");
</script>

This page now hands off directly to the live IDX v2 product on `https://idx.mehrdadzaker.com`. If you are not redirected automatically, use the button below.

<div class="mdz-auth-panel">
  <h2>Continue to IDX v2</h2>
  <p class="mdz-auth-panel__copy">
    Website-hosted sign-in has been retired. Authentication and the full LLM Wiki product now run on the IDX app host.
  </p>
  <p>
    <a class="btn btn--primary mdz-cta" href="https://idx.mehrdadzaker.com/auth/login?return_to=https%3A%2F%2Fidx.mehrdadzaker.com%2Fv2%2Fportal">Sign in on idx.mehrdadzaker.com</a>
  </p>
</div>

The public [Industry Guidance]({{ '/idx/assistant/' | relative_url }}) page stays on this site. The actual product portal lives at [`https://idx.mehrdadzaker.com/v2/portal`](https://idx.mehrdadzaker.com/v2/portal). If you need help with that setup, [contact Mehrdad]({{ '/contact/' | relative_url }}).
