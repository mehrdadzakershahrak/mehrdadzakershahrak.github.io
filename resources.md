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

<div class="mdz-resource-hub">
  <section class="mdz-resource-hub__hero" aria-labelledby="resource-hub-title">
    <div class="mdz-resource-hub__hero-copy">
      <p class="mdz-resource-hub__eyebrow">Private AI Resource Hub</p>
      <h1 id="resource-hub-title">Private AI Resource Hub</h1>
      <p class="mdz-resource-hub__lede">
        Five source-backed guides for teams moving private LLMs, secure RAG, document grounding, and evaluation from prototype into controlled production.
      </p>
      <div class="mdz-resource-hub__actions">
        <a class="btn btn--primary mdz-cta" href="{{ primary_guide.url | relative_url }}">Start with the production guide</a>
        <a class="btn btn--small mdz-cta mdz-cta--outline" href="{{ '/contact/' | relative_url }}">Discuss a deployment</a>
      </div>
    </div>
    <div class="mdz-resource-hub__signal-panel" aria-label="Resource hub profile">
      <article>
        <strong>5</strong>
        <span>Pillar guides</span>
      </article>
      <article>
        <strong>20</strong>
        <span>FAQ answers</span>
      </article>
      <article>
        <strong>2+</strong>
        <span>Cited sources per guide</span>
      </article>
    </div>
  </section>

  <nav class="mdz-resource-hub__problem-strip" aria-label="Choose a guide by problem">
    {% for guide in guides %}
      <a href="{{ guide.url | relative_url }}">
        <span>{{ forloop.index | prepend: "0" | slice: -2, 2 }}</span>
        {{ guide.problem_label | default: guide.pillar }}
      </a>
    {% endfor %}
  </nav>

  <section class="mdz-resource-hub__guides" aria-labelledby="resource-guide-list-title">
    <div class="mdz-resource-hub__section-head">
      <p class="mdz-resource-hub__eyebrow">Source-backed guide map</p>
      <h2 id="resource-guide-list-title">Choose the constraint that is blocking launch</h2>
      <p>
        Each guide is written for a specific production bottleneck: pilot hardening, hallucination control, secure retrieval, reliability evaluation, or regulated deployment tradeoffs.
      </p>
    </div>

    <div class="mdz-resource-hub__grid">
      {% for guide in guides %}
        <article class="mdz-resource-card">
          <div class="mdz-resource-card__top">
            <span class="mdz-resource-card__number">{{ forloop.index | prepend: "0" | slice: -2, 2 }}</span>
            <span class="mdz-resource-card__pillar">{{ guide.pillar | default: "Resource Guide" }}</span>
          </div>
          <h3><a href="{{ guide.url | relative_url }}">{{ guide.title }}</a></h3>
          <p>{{ guide.excerpt | default: guide.description }}</p>
          {% if guide.ui_tags %}
            <div class="mdz-resource-card__tags" aria-label="Guide topics">
              {% for tag in guide.ui_tags limit: 3 %}
                <span>{{ tag }}</span>
              {% endfor %}
            </div>
          {% endif %}
          <div class="mdz-resource-card__meta">
            <span>Source-backed</span>
            <span>{{ guide.faqs | size }} FAQ answers</span>
          </div>
          <a class="btn btn--small mdz-cta" href="{{ guide.url | relative_url }}">Read guide</a>
        </article>
      {% endfor %}
    </div>
  </section>

  <section class="mdz-resource-hub__service-map" aria-labelledby="resource-service-map-title">
    <div>
      <p class="mdz-resource-hub__eyebrow">Apply the guides</p>
      <h2 id="resource-service-map-title">Pair the reading path with the right implementation path</h2>
    </div>
    <div class="mdz-resource-hub__service-links">
      <a href="{{ '/private-ai-deployment/' | relative_url }}">Private AI deployment</a>
      <a href="{{ '/custom-ai-systems/' | relative_url }}">Custom AI systems</a>
      <a href="{{ '/idx/assistant/' | relative_url }}">IDX document review</a>
      <a href="{{ '/ai-robotics-solutions/' | relative_url }}">Solutions</a>
      <a href="{{ '/contact/' | relative_url }}">Contact</a>
    </div>
  </section>
</div>
