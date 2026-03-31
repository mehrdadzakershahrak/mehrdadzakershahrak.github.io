---
layout: single
title: "IDX Support"
permalink: /idx/support/
classes: wide
footer_variant: idx
---

<section class="mdz-contact">
  <section class="mdz-contact__hero">
    <div class="mdz-contact__hero-copy">
      <p class="mdz-contact__eyebrow">IDX Support</p>
      <h1 class="mdz-contact__title">Get help with the IDX dashboard, document workflows, or rollout questions.</h1>
      <p class="mdz-contact__lede">
        Use this page when the issue is specific to IDX: signing in, uploading PDFs, document readiness, search results, viewer links, workflow fit, or operational questions about how IDX should be used in a document-heavy process.
      </p>
      <div class="mdz-contact__actions">
        <a class="btn btn--primary mdz-cta" href="mailto:{{ site.contact_email }}?subject=IDX%20Support">Email {{ site.contact_email }}</a>
        <a class="btn btn--small mdz-cta mdz-cta--outline" href="{{ '/idx/dashboard/' | relative_url }}">Open IDX Dashboard</a>
      </div>
    </div>
  </section>

  <div class="mdz-contact__grid">
    <section class="mdz-contact__panel">
      <h2>Good reasons to reach out</h2>
      <ul>
        <li>Google sign-in, session, or access issues for the IDX dashboard</li>
        <li>PDF upload, indexing, readiness, or viewer-link problems</li>
        <li>Questions about how to structure a document set or search workflow</li>
        <li>Planning help for connecting IDX to a broader ChatGPT workflow</li>
      </ul>
    </section>

    <section class="mdz-contact__panel">
      <h2>What to include</h2>
      <ul>
        <li>The page or IDX step where the issue happens</li>
        <li>The document type, workflow, or job state involved</li>
        <li>What you expected to happen versus what actually happened</li>
        <li>Any privacy, access, or operational constraints that matter</li>
      </ul>
    </section>
  </div>

  <section class="mdz-contact__panel mdz-contact__panel--wide">
    <h2>Response framing</h2>
    <p>
      The goal is to resolve the blocker quickly or clarify the right next step. Expect a concise response focused on diagnosis, workflow guidance, or whether the issue belongs in IDX support versus a broader implementation conversation.
    </p>
    <p>
      For support requests, email <a href="mailto:{{ site.contact_email }}">{{ site.contact_email }}</a>. For policy details, review the <a href="{{ '/idx/privacy/' | relative_url }}">IDX Privacy</a> and <a href="{{ '/idx/terms/' | relative_url }}">IDX Terms</a> pages.
    </p>
  </section>
</section>
