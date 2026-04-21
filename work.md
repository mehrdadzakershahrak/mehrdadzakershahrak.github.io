---
layout: single
title: "Work"
description: "Selected engagements where private AI moved from pilot to production."
permalink: /work/
classes: wide work-page
toc: true
toc_label: "Engagements"
suppress_default_h1: true
---

<section class="mdz-band mdz-band--work-hero" aria-labelledby="work-hero-title">
  <div class="mdz-band__inner">
    <p class="mdz-home-section-head__eyebrow">Proof of work</p>
    <h1 id="work-hero-title">Engagements where private AI shipped.</h1>
    <p class="mdz-muted">
      A short, anonymized record of the systems I've helped move from pilot to production. Each one picks one constraint — regulation, boundary, latency, workflow — and drives until the number moves.
    </p>
    <p class="mdz-home-proof-note mdz-muted">
      <em>TODO(mehrdad): this page is scaffolded. Replace each case-study block with real client work. Keep the structure: constraint → what I did → measurable outcome. Anonymize names as needed; the numbers do the talking.</em>
    </p>
  </div>
</section>

<section id="case-regulated-finance" class="mdz-band mdz-band--case">
  <div class="mdz-band__inner">
    <p class="mdz-home-section-head__eyebrow">Financial services · Regulated</p>
    <h2>Cutting hallucination rate by ~45% on a 50k-document RAG</h2>

    <h3>Constraint</h3>
    <p>Every answer had to cite a source page an auditor could check in under 30 seconds. Reviewer throughput had collapsed because the existing prototype drifted from sources on ~1 in 3 queries.</p>

    <h3>What shipped</h3>
    <ul>
      <li>Reranker over a 50k-doc hybrid index (BM25 + dense).</li>
      <li>Evaluator harness with ~800 adversarial questions, gating launch.</li>
      <li>Inline citation UI that linked directly to the source passage.</li>
    </ul>

    <h3>Outcome</h3>
    <ul>
      <li>Hallucination rate down ~45% on the held-out eval set.</li>
      <li>Reviewer time-to-verify down from ~2 min to ~25 seconds.</li>
      <li>Launched inside the client's VPC with the compliance team signed off.</li>
    </ul>

    <p class="mdz-muted"><em>TODO(mehrdad): confirm the exact eval delta and the VPC region before copy goes live.</em></p>
  </div>
</section>

<section id="case-healthcare-hybrid" class="mdz-band mdz-band--case">
  <div class="mdz-band__inner">
    <p class="mdz-home-section-head__eyebrow">Healthcare · Hybrid deploy</p>
    <h2>Taking a stalled pilot into production in 9 weeks</h2>

    <h3>Constraint</h3>
    <p>Pilot ran on a third-party cloud endpoint that the security review blocked. The team had burned six months and were about to retire the project.</p>

    <h3>What shipped</h3>
    <ul>
      <li>VPC-native model-serving stack with quantized 13B model.</li>
      <li>Retrieval boundary enforced at the ingest layer — PHI never leaves the VPC.</li>
      <li>Load + drift monitoring tied to the on-call rotation.</li>
    </ul>

    <h3>Outcome</h3>
    <ul>
      <li>Production launch 9 weeks after engagement started.</li>
      <li>Cost-per-query down ~60% vs. the original cloud prototype.</li>
      <li>Security review approved on first pass of the hybrid architecture.</li>
    </ul>

    <p class="mdz-muted"><em>TODO(mehrdad): swap in the precise cost-per-query number from the Q2 finance review.</em></p>
  </div>
</section>

<section id="case-industrial-onprem" class="mdz-band mdz-band--case">
  <div class="mdz-band__inner">
    <p class="mdz-home-section-head__eyebrow">Industrial · On-prem</p>
    <h2>Predictive-failure signals 3× earlier</h2>

    <h3>Constraint</h3>
    <p>Telemetry from the plant floor was rich but opaque; field technicians got paged too late, and the existing rules-engine couldn't catch compound failures.</p>

    <h3>What shipped</h3>
    <ul>
      <li>On-prem ingestion pipeline connected to the existing historian.</li>
      <li>LLM-generated root-cause narratives with linked sensor excerpts.</li>
      <li>Anomaly scoring tuned against 18 months of labelled failure events.</li>
    </ul>

    <h3>Outcome</h3>
    <ul>
      <li>Mean time from first-anomaly to technician page down 3×.</li>
      <li>False positive rate held below the prior rules-engine baseline.</li>
      <li>Narratives now attached to every on-call ticket.</li>
    </ul>

    <p class="mdz-muted"><em>TODO(mehrdad): the 3× figure should be backed by the plant's labelled event log — confirm with the ops team.</em></p>
  </div>
</section>

<section class="mdz-band mdz-band--work-cta">
  <div class="mdz-band__inner">
    <h2>Is there a constraint your team is stuck on?</h2>
    <p class="mdz-muted">Retrieval, evaluation, deployment, workflow fit — pick one and bring the surrounding context.</p>
    <div class="mdz-home-hero__actions">
      <a class="btn btn--primary mdz-cta" href="{{ '/contact/' | relative_url }}" data-analytics="cta_contact_click" data-analytics-source="work">Start a conversation</a>
    </div>
  </div>
</section>
