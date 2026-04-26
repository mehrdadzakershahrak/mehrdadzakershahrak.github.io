---
layout: single
title: "Resources"
description: "Source-backed resource hub on private AI deployment, secure RAG, document grounding, reliability evaluation, and regulated-industry AI tradeoffs."
permalink: /resources/
classes: wide resources-hub-page
suppress_default_h1: true
---

{% assign guides = site.ai_material | where: "resource_guide", true | sort: "order" %}
{% assign references = site.ai_material | where: "content_type", "reference" | sort: "date" | reverse %}
{% assign primary_guide = guides | first %}
{% assign faq_count = 0 %}
{% for guide in guides %}
  {% assign faq_count = faq_count | plus: guide.faqs.size %}
{% endfor %}

<section class="eh-resource-hub">
  <section class="eh-showcase__hero" aria-labelledby="resource-hub-title">
    <div class="eh-showcase__copy">
      <p class="eh-eyebrow">Private AI Resource Hub</p>
      <h1 id="resource-hub-title" class="eh-title">Private AI Resource Hub</h1>
      <p class="eh-dek">
        Source-backed guides and practical references for teams moving private LLMs, secure RAG, document grounding, and evaluation from prototype into controlled production.
      </p>
      <div class="eh-action-row">
        <a class="eh-btn" href="{{ primary_guide.url | relative_url }}">Start with the production guide</a>
        <a class="eh-btn eh-btn--secondary" href="{{ '/contact/' | relative_url }}">Discuss a deployment</a>
      </div>
    </div>
    <div class="eh-metric-grid eh-metric-grid--stacked" aria-label="Resource hub profile">
      <article class="eh-metric-card">
        <strong>{{ guides | size }}</strong>
        <span>Pillar guides</span>
      </article>
      <article class="eh-metric-card">
        <strong>{{ faq_count }}</strong>
        <span>FAQ answers</span>
      </article>
      <article class="eh-metric-card">
        <strong>{{ references | size }}</strong>
        <span>Technical references</span>
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
          {% if guide.image %}
            <div class="eh-material-media">
              <img src="{{ guide.image | relative_url }}" alt="{{ guide.image_alt | escape }}" loading="lazy">
            </div>
          {% elsif guide.image_placeholder %}
            <div class="eh-material-placeholder" aria-hidden="true">
              <span>{{ guide.image_placeholder }}</span>
            </div>
          {% endif %}
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

  {% if references and references.size > 0 %}
    <section class="eh-section" aria-labelledby="resource-reference-list-title">
      <div class="eh-section-head">
        <p class="eh-eyebrow">Technical references</p>
        <h2 id="resource-reference-list-title">Keep implementation notes separate from service pages</h2>
        <p>
          References stay in the AI material library so service pages can stay focused while technical notes remain easy to expand.
        </p>
      </div>

      <div class="eh-card-grid">
        {% for item in references %}
          <article class="eh-card">
            {% if item.image %}
              <div class="eh-material-media">
                <img src="{{ item.image | relative_url }}" alt="{{ item.image_alt | escape }}" loading="lazy">
              </div>
            {% elsif item.image_placeholder %}
              <div class="eh-material-placeholder" aria-hidden="true">
                <span>{{ item.image_placeholder }}</span>
              </div>
            {% endif %}
            <p class="eh-eyebrow">{{ item.problem_label | default: "Reference" }}</p>
            <h3><a href="{{ item.url | relative_url }}">{{ item.title }}</a></h3>
            <p>{{ item.excerpt | default: item.description }}</p>
            {% if item.ui_tags %}
              <div class="eh-chip-row" aria-label="Reference topics">
                {% for tag in item.ui_tags limit: 3 %}
                  <span class="eh-chip">{{ tag }}</span>
                {% endfor %}
              </div>
            {% endif %}
            <a class="eh-btn eh-btn--secondary" href="{{ item.url | relative_url }}">Read reference</a>
          </article>
        {% endfor %}
      </div>
    </section>
  {% endif %}

  <section class="eh-cta-panel" aria-labelledby="resource-service-map-title">
    <div>
      <p class="eh-eyebrow">Apply the guides</p>
      <h2 id="resource-service-map-title">Pair the reading path with the right implementation path</h2>
    </div>
    <div class="eh-link-cloud">
      <a href="{{ '/private-ai-deployment/' | relative_url }}">Private AI deployment</a>
      <a href="{{ '/custom-ai-systems/' | relative_url }}">Custom AI systems</a>
      <a href="{{ '/products/idx/' | relative_url }}">IDX document review</a>
      <a href="{{ '/ai-robotics-solutions/' | relative_url }}">Solutions</a>
      <a href="{{ '/contact/' | relative_url }}">Contact</a>
    </div>
  </section>
</section>
