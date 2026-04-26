---
layout: single
title: "Work"
description: "Selected engagements where private AI moved from pilot to production."
permalink: /work/
classes: wide work-page
suppress_default_h1: true
---

<section class="eh-showcase eh-showcase--work">
  <section class="eh-showcase__hero" aria-labelledby="work-hero-title">
    <div class="eh-showcase__copy">
      <p class="eh-eyebrow">Proof of work</p>
      <h1 id="work-hero-title" class="eh-title">Engagements where private AI shipped.</h1>
      <p class="eh-dek">
        A short, anonymized record of systems I've helped move from pilot to production. Each engagement centers on one constraint: regulation, deployment boundary, latency, or workflow fit.
      </p>
    </div>
    <aside class="eh-side-panel" aria-label="Work focus">
      <p class="eh-eyebrow">Flat Site Order</p>
      <ol class="eh-mini-index">
        <li><a href="{{ '/products/' | relative_url }}">Product Catalogue</a></li>
        <li><a href="{{ '/newsletter/' | relative_url }}">Writing</a></li>
        <li><a href="{{ '/resources/' | relative_url }}">Resources</a></li>
        <li><a href="{{ '/about/' | relative_url }}">About</a></li>
        <li><a href="{{ '/contact/' | relative_url }}">Contact</a></li>
      </ol>
    </aside>
  </section>

  <section id="case-regulated-finance" class="eh-section eh-case">
    <p class="eh-eyebrow">Financial services · Regulated</p>
    <h2>Tightening source grounding for a regulated document RAG</h2>

    <div class="eh-case__grid">
      <article class="eh-card">
        <h3>Constraint</h3>
        <p>Every answer had to cite source material that an auditor could verify. The prototype could answer plausible questions, but reviewers still needed a dependable path from response to evidence.</p>
      </article>
      <article class="eh-card">
        <h3>What shipped</h3>
        <ul>
          <li>Hybrid retrieval with reranking over the approved document corpus.</li>
          <li>Evaluation harness with adversarial and workflow-specific questions.</li>
          <li>Inline citation UI linking each answer back to the source passage.</li>
        </ul>
      </article>
      <article class="eh-card">
        <h3>Outcome</h3>
        <ul>
          <li>Reviewers could trace answers to source passages before acting.</li>
          <li>Launch readiness was gated by retrieval and answer-quality checks.</li>
          <li>The deployment stayed inside the client's approved infrastructure boundary.</li>
        </ul>
      </article>
    </div>
  </section>

  <section id="case-healthcare-hybrid" class="eh-section eh-case">
    <p class="eh-eyebrow">Healthcare · Hybrid deploy</p>
    <h2>Moving a blocked pilot through production review</h2>

    <div class="eh-case__grid">
      <article class="eh-card">
        <h3>Constraint</h3>
        <p>The pilot depended on a hosted model path that did not fit the security review. The technical goal was clear, but the deployment boundary and operating model needed to change before launch.</p>
      </article>
      <article class="eh-card">
        <h3>What shipped</h3>
        <ul>
          <li>VPC-native model-serving stack sized for the workflow.</li>
          <li>Retrieval boundary enforced at the ingest layer so sensitive data stayed inside approved infrastructure.</li>
          <li>Load and drift monitoring tied to the on-call rotation.</li>
        </ul>
      </article>
      <article class="eh-card">
        <h3>Outcome</h3>
        <ul>
          <li>The team had a production path that matched security expectations.</li>
          <li>Retrieval, inference, and monitoring responsibilities were explicit before rollout.</li>
          <li>The architecture could be reviewed without relying on an uncontrolled external endpoint.</li>
        </ul>
      </article>
    </div>
  </section>

  <section id="case-industrial-onprem" class="eh-section eh-case">
    <p class="eh-eyebrow">Industrial · On-prem</p>
    <h2>Surfacing earlier predictive-failure signals</h2>

    <div class="eh-case__grid">
      <article class="eh-card">
        <h3>Constraint</h3>
        <p>Telemetry from the plant floor was rich but hard to interpret quickly. Field technicians needed a clearer signal when compound failures started to appear across systems.</p>
      </article>
      <article class="eh-card">
        <h3>What shipped</h3>
        <ul>
          <li>On-prem ingestion pipeline connected to the existing historian.</li>
          <li>Anomaly scoring tuned against labelled failure events.</li>
          <li>LLM-generated root-cause narratives with linked sensor excerpts.</li>
        </ul>
      </article>
      <article class="eh-card">
        <h3>Outcome</h3>
        <ul>
          <li>Technicians received clearer context when early failure patterns appeared.</li>
          <li>Root-cause narratives attached source telemetry to each operational ticket.</li>
          <li>The workflow kept plant data inside the on-prem environment.</li>
        </ul>
      </article>
    </div>
  </section>

  <section class="eh-cta-panel" aria-labelledby="work-cta-title">
    <div>
      <p class="eh-eyebrow">Contact</p>
      <h2 id="work-cta-title">Is there a constraint your team is stuck on?</h2>
      <p>Retrieval, evaluation, deployment, workflow fit: pick one and bring the surrounding context.</p>
    </div>
    <div class="eh-action-row">
      <a class="eh-btn" href="{{ '/contact/' | relative_url }}" data-analytics="cta_contact_click" data-analytics-source="work">Start a conversation</a>
    </div>
  </section>
</section>
