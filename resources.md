---
layout: single
title: "Resources"
description: "Source-backed resource hub on private AI deployment, secure RAG, document grounding, reliability evaluation, and regulated-industry AI tradeoffs."
permalink: /resources/
classes: wide resources-hub-page
suppress_default_h1: true
---

{% assign guides = site.resource_guides | sort: "order" %}
{% assign primary_guide = guides | first %}

<section class="eh-resource-hub">
  <section class="eh-showcase__hero" aria-labelledby="resource-hub-title">
    <div class="eh-showcase__copy">
      <p class="eh-eyebrow">Private AI Resource Hub</p>
      <h1 id="resource-hub-title" class="eh-title">Private AI Resource Hub</h1>
      <p class="eh-dek">
        Five source-backed guides for teams moving private LLMs, secure RAG, document grounding, and evaluation from prototype into controlled production.
      </p>
      <div class="eh-action-row">
        <a class="eh-btn" href="{{ primary_guide.url | relative_url }}">Start with the production guide</a>
        <a class="eh-btn eh-btn--secondary" href="{{ '/contact/' | relative_url }}">Discuss a deployment</a>
      </div>
    </div>
    <div class="eh-metric-grid eh-metric-grid--stacked" aria-label="Resource hub profile">
      <article class="eh-metric-card">
        <strong>5</strong>
        <span>Pillar guides</span>
      </article>
      <article class="eh-metric-card">
        <strong>20</strong>
        <span>FAQ answers</span>
      </article>
      <article class="eh-metric-card">
        <strong>2+</strong>
        <span>Cited sources per guide</span>
      </article>
    </div>
  </section>

  <nav class="eh-problem-strip" aria-label="Choose a guide by problem">
    {% for guide in guides %}
      <a href="{{ guide.url | relative_url }}">
        <span>{{ forloop.index | prepend: "0" | slice: -2, 2 }}</span>
        {{ guide.problem_label | default: guide.pillar }}
      </a>
    {% endfor %}
  </nav>

  <section class="eh-section" aria-labelledby="resource-guide-list-title">
    <div class="eh-section-head">
      <p class="eh-eyebrow">Source-backed guide map</p>
      <h2 id="resource-guide-list-title">Choose the constraint that is blocking launch</h2>
      <p>
        Each guide is written for a specific production bottleneck: pilot hardening, hallucination control, secure retrieval, reliability evaluation, or regulated deployment tradeoffs.
      </p>
    </div>

    <div class="eh-guide-grid">
      {% for guide in guides %}
        <article class="eh-guide-card">
          <div class="eh-guide-card__top">
            <span>{{ forloop.index | prepend: "0" | slice: -2, 2 }}</span>
            <span>{{ guide.pillar | default: "Resource Guide" }}</span>
          </div>
          <h3><a href="{{ guide.url | relative_url }}">{{ guide.title }}</a></h3>
          <p>{{ guide.excerpt | default: guide.description }}</p>
          {% if guide.ui_tags %}
            <div class="eh-chip-row" aria-label="Guide topics">
              {% for tag in guide.ui_tags limit: 3 %}
                <span class="eh-chip">{{ tag }}</span>
              {% endfor %}
            </div>
          {% endif %}
          <div class="eh-meta">
            <span>Source-backed</span>
            <span>{{ guide.faqs | size }} FAQ answers</span>
          </div>
          <a class="eh-btn eh-btn--secondary" href="{{ guide.url | relative_url }}">Read guide</a>
        </article>
      {% endfor %}
    </div>
  </section>

  <section class="eh-cta-panel" aria-labelledby="resource-service-map-title">
    <div>
      <p class="eh-eyebrow">Apply the guides</p>
      <h2 id="resource-service-map-title">Pair the reading path with the right implementation path</h2>
    </div>
    <div class="eh-link-cloud">
      <a href="{{ '/private-ai-deployment/' | relative_url }}">Private AI deployment</a>
      <a href="{{ '/custom-ai-systems/' | relative_url }}">Custom AI systems</a>
      <a href="{{ '/idx/assistant/' | relative_url }}">IDX document review</a>
      <a href="{{ '/ai-robotics-solutions/' | relative_url }}">Solutions</a>
      <a href="{{ '/contact/' | relative_url }}">Contact</a>
    </div>
  </section>
</section>
