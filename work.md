---
layout: single
title: "Work"
description: "Selected engagements where private AI moved from pilot to production."
permalink: /work/
classes: wide work-page
suppress_default_h1: true
---

<section class="mdz-band mdz-band--work-hero" aria-labelledby="work-hero-title">
  <div class="mdz-band__inner">
    <p class="mdz-home-section-head__eyebrow">Proof of work</p>
    <h1 id="work-hero-title">Engagements where private AI shipped.</h1>
    <p class="mdz-muted">
      A short, anonymized record of systems I've helped move from pilot to production. Each engagement centers on one constraint: regulation, deployment boundary, latency, or workflow fit.
    </p>
  </div>
</section>

<section id="case-regulated-finance" class="mdz-band mdz-band--case">
  <div class="mdz-band__inner">
    <p class="mdz-home-section-head__eyebrow">Financial services · Regulated</p>
    <h2>Tightening source grounding for a regulated document RAG</h2>

    <h3>Constraint</h3>
    <p>Every answer had to cite source material that an auditor could verify. The prototype could answer plausible questions, but reviewers still needed a dependable path from response to evidence.</p>

    <h3>What shipped</h3>
    <ul>
      <li>Hybrid retrieval with reranking over the approved document corpus.</li>
      <li>Evaluation harness with adversarial and workflow-specific questions.</li>
      <li>Inline citation UI linking each answer back to the source passage.</li>
    </ul>

    <h3>Outcome</h3>
    <ul>
      <li>Reviewers could trace answers to source passages before acting.</li>
      <li>Launch readiness was gated by retrieval and answer-quality checks.</li>
      <li>The deployment stayed inside the client's approved infrastructure boundary.</li>
    </ul>
  </div>
</section>

<section id="case-healthcare-hybrid" class="mdz-band mdz-band--case">
  <div class="mdz-band__inner">
    <p class="mdz-home-section-head__eyebrow">Healthcare · Hybrid deploy</p>
    <h2>Moving a blocked pilot through production review</h2>

    <h3>Constraint</h3>
    <p>The pilot depended on a hosted model path that did not fit the security review. The technical goal was clear, but the deployment boundary and operating model needed to change before launch.</p>

    <h3>What shipped</h3>
    <ul>
      <li>VPC-native model-serving stack sized for the workflow.</li>
      <li>Retrieval boundary enforced at the ingest layer so sensitive data stayed inside approved infrastructure.</li>
      <li>Load + drift monitoring tied to the on-call rotation.</li>
    </ul>

    <h3>Outcome</h3>
    <ul>
      <li>The team had a production path that matched security expectations.</li>
      <li>Retrieval, inference, and monitoring responsibilities were explicit before rollout.</li>
      <li>The architecture could be reviewed without relying on an uncontrolled external endpoint.</li>
    </ul>
  </div>
</section>

<section id="case-industrial-onprem" class="mdz-band mdz-band--case">
  <div class="mdz-band__inner">
    <p class="mdz-home-section-head__eyebrow">Industrial · On-prem</p>
    <h2>Surfacing earlier predictive-failure signals</h2>

    <h3>Constraint</h3>
    <p>Telemetry from the plant floor was rich but hard to interpret quickly. Field technicians needed a clearer signal when compound failures started to appear across systems.</p>

    <h3>What shipped</h3>
    <ul>
      <li>On-prem ingestion pipeline connected to the existing historian.</li>
      <li>Anomaly scoring tuned against labelled failure events.</li>
      <li>LLM-generated root-cause narratives with linked sensor excerpts.</li>
    </ul>

    <h3>Outcome</h3>
    <ul>
      <li>Technicians received clearer context when early failure patterns appeared.</li>
      <li>Root-cause narratives attached source telemetry to each operational ticket.</li>
      <li>The workflow kept plant data inside the on-prem environment.</li>
    </ul>
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
