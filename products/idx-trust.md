---
layout: single
title: "IDX Trust and Data Flow"
description: "How IDX separates the public product page, live product host, uploads, indexing, viewer links, retention, and evaluation boundaries."
permalink: /products/idx/trust/
classes: wide
suppress_default_h1: true
---

<section class="eh-showcase eh-showcase--idx-trust">
  <section class="eh-showcase__hero" aria-labelledby="idx-trust-page-title">
    <div class="eh-showcase__copy">
      <p class="eh-eyebrow">IDX Trust</p>
      <h1 id="idx-trust-page-title" class="eh-title">Confirm the data boundary before real documents enter the workflow.</h1>
      <p class="eh-dek">
        This page explains how the public IDX marketing surface, live product host, uploads, indexing, source viewer, and review responsibilities fit together.
      </p>
      <div class="eh-action-row">
        <a class="eh-btn" href="{{ '/idx/dashboard/' | relative_url }}">Open IDX dashboard</a>
        <a class="eh-btn eh-btn--secondary" href="{{ '/products/idx/' | relative_url }}">Back to IDX</a>
        <a class="eh-btn eh-btn--secondary" href="{{ '/idx/privacy/' | relative_url }}">Privacy</a>
      </div>
    </div>

    <aside class="eh-side-panel" aria-label="IDX evaluation boundary">
      <p class="eh-eyebrow">Evaluation Default</p>
      <h2>Use synthetic, redacted, or approved documents until the environment is confirmed.</h2>
      <ul class="eh-check-list">
        <li>Do not upload confidential, regulated, export-controlled, or highly sensitive material until IDX is confirmed as the right environment.</li>
        <li>Keep a human reviewer responsible for validating citations and outputs.</li>
        <li>Use the support path when upload, indexing, search, or viewer-link behavior needs diagnosis.</li>
      </ul>
    </aside>
  </section>

  <section class="eh-section" aria-labelledby="idx-trust-flow-title">
    <div class="eh-section-head">
      <p class="eh-eyebrow">Data Flow</p>
      <h2 id="idx-trust-flow-title">What runs on the public site versus the live product host.</h2>
    </div>
    <div class="eh-trust-flow" aria-label="IDX public site and product host flow">
      <article>
        <span>01</span>
        <h3>Public product page</h3>
        <p><code>www.mehrdadzaker.com/products/idx/</code> explains product fit, proof assets, support routes, privacy, terms, and evaluation guidance.</p>
      </article>
      <article>
        <span>02</span>
        <h3>Static handoff</h3>
        <p><code>/idx/dashboard/</code> and <code>/login/</code> are handoff routes. They redirect to the live product host rather than running authenticated work on this static site.</p>
      </article>
      <article>
        <span>03</span>
        <h3>Live IDX host</h3>
        <p><code>idx.mehrdadzaker.com</code> handles sign-in, uploaded files, indexing, search, viewer links, workspace state, and related operational logs.</p>
      </article>
      <article>
        <span>04</span>
        <h3>Human review</h3>
        <p>Reviewers use citations, excerpts, and source pages to validate outputs before relying on them in legal, financial, operational, or policy decisions.</p>
      </article>
    </div>
  </section>

  <section class="eh-section" aria-labelledby="idx-trust-process-title">
    <div class="eh-section-head">
      <p class="eh-eyebrow">Evaluation Process</p>
      <h2 id="idx-trust-process-title">A safe first review starts with approved material.</h2>
    </div>
    <ol class="eh-step-list">
      <li class="eh-step">
        <span class="eh-step__index">01</span>
        <h3>Pick safe files</h3>
        <p>Start with synthetic, redacted, public, or explicitly approved PDFs that represent the real workflow.</p>
      </li>
      <li class="eh-step">
        <span class="eh-step__index">02</span>
        <h3>Confirm access</h3>
        <p>Use product-host sign-in and confirm who should have access before uploading operational documents.</p>
      </li>
      <li class="eh-step">
        <span class="eh-step__index">03</span>
        <h3>Inspect outputs</h3>
        <p>Check ingest state, citations, excerpts, and viewer links before treating any answer as useful.</p>
      </li>
      <li class="eh-step">
        <span class="eh-step__index">04</span>
        <h3>Escalate uncertainty</h3>
        <p>Use IDX support or a private deployment conversation when privacy, retention, access, or workflow risk is unresolved.</p>
      </li>
    </ol>
  </section>

  <section class="eh-section" aria-labelledby="idx-trust-records-title">
    <div class="eh-section-head">
      <p class="eh-eyebrow">Records And Retention</p>
      <h2 id="idx-trust-records-title">What IDX may process during authenticated use.</h2>
      <p>
        The detailed policy language lives on the IDX Privacy and Terms pages. The short version is that authenticated IDX workflows may process account information, uploaded PDFs, extracted text, document IDs, workspace IDs, search requests, citations, viewer links, job-state records, and operational logs needed to operate and support the service.
      </p>
    </div>
    <div class="eh-card-grid">
      <article class="eh-card">
        <h3>Uploads and indexing</h3>
        <p>Files are processed so IDX can extract text, track job state, support search, and generate viewer-linked review paths.</p>
      </article>
      <article class="eh-card">
        <h3>Search and source review</h3>
        <p>Search requests, citations, excerpts, viewer links, and workflow state may be retained to operate, debug, and improve the service.</p>
      </article>
      <article class="eh-card">
        <h3>Support and reliability</h3>
        <p>Operational logs may be used for security, abuse prevention, availability, performance, error diagnosis, and support response.</p>
      </article>
    </div>
  </section>

  <section class="eh-cta-panel" aria-labelledby="idx-trust-cta-title">
    <div>
      <p class="eh-eyebrow">Next Step</p>
      <h2 id="idx-trust-cta-title">Use the right environment for the document risk.</h2>
      <p>For early evaluation, use approved sample material. For sensitive or regulated workflows, confirm privacy, access, deployment, and retention expectations before uploading real documents.</p>
    </div>
    <div class="eh-action-row">
      <a class="eh-btn" href="{{ '/idx/support/' | relative_url }}">Contact IDX Support</a>
      <a class="eh-btn eh-btn--secondary" href="{{ '/idx/privacy/' | relative_url }}">Read privacy</a>
      <a class="eh-btn eh-btn--secondary" href="{{ '/idx/terms/' | relative_url }}">Read terms</a>
    </div>
  </section>
</section>
