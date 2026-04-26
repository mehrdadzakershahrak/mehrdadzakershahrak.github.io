---
layout: single
title: "Product Catalogue"
description: "Public product catalogue for IDX and future workflow products from Mehrdad Zaker."
permalink: /products/
classes: wide products-page
suppress_default_h1: true
---

{% assign products = site.data.products | sort: "order" %}
{% assign featured_product = products | first %}

<section class="eh-showcase eh-showcase--products">
  <section class="eh-showcase__hero" aria-labelledby="products-title">
    <div class="eh-showcase__copy">
      <p class="eh-eyebrow">Product Catalogue</p>
      <h1 id="products-title" class="eh-title">Products built around real workflow constraints.</h1>
      <p class="eh-dek">
        This is the public catalogue for productized systems. Each item explains what the product is for, how it fits the workflow, and where the operational surface lives.
      </p>
      <div class="eh-action-row">
        <a class="eh-btn" href="{{ featured_product.url | relative_url }}">View {{ featured_product.title }}</a>
        <a class="eh-btn eh-btn--secondary" href="{{ '/contact/' | relative_url }}">Discuss product fit</a>
      </div>
    </div>
    <div class="eh-metric-grid eh-metric-grid--stacked" aria-label="Product catalogue profile">
      <article class="eh-metric-card">
        <strong>{{ products | size }}</strong>
        <span>Public product profiles</span>
      </article>
      <article class="eh-metric-card">
        <strong>Operationally separate</strong>
        <span>Public product pages stay on this site while live product access can run on dedicated hosts.</span>
      </article>
      <article class="eh-metric-card">
        <strong>Future-ready</strong>
        <span>The catalogue is structured to accept more products without changing the IA again.</span>
      </article>
    </div>
  </section>

  <section class="eh-section" aria-labelledby="product-catalogue-list-title">
    <div class="eh-section-head">
      <p class="eh-eyebrow">Current catalogue</p>
      <h2 id="product-catalogue-list-title">Start with the product that matches the workflow bottleneck.</h2>
      <p>
        IDX is the first catalogue item. Future product pages can join this hub without changing the nav or public routing model.
      </p>
    </div>

    <div class="eh-card-grid">
      {% for product in products %}
        <article class="eh-card">
          <p class="eh-eyebrow">{{ product.eyebrow }}</p>
          <h3><a href="{{ product.url | relative_url }}">{{ product.title }}</a></h3>
          <p>{{ product.summary }}</p>
          {% if product.tags and product.tags.size > 0 %}
            <div class="eh-chip-row" aria-label="{{ product.title }} topics">
              {% for tag in product.tags %}
                <span class="eh-chip">{{ tag }}</span>
              {% endfor %}
            </div>
          {% endif %}
          <div class="eh-meta">
            <span>{{ product.status }}</span>
            <span>{{ product.availability }}</span>
          </div>
          {% if product.secondary_links and product.secondary_links.size > 0 %}
            <div class="eh-link-cloud">
              {% for link in product.secondary_links %}
                <a href="{{ link.url | relative_url }}">{{ link.label }}</a>
              {% endfor %}
            </div>
          {% endif %}
          <a class="eh-btn eh-btn--secondary" href="{{ product.cta_url | relative_url }}">{{ product.cta_label }}</a>
        </article>
      {% endfor %}
    </div>
  </section>

  <section class="eh-cta-panel" aria-labelledby="products-cta-title">
    <div>
      <p class="eh-eyebrow">Build around the workflow</p>
      <h2 id="products-cta-title">Need help choosing whether the right answer is a product, a deployment path, or a custom system?</h2>
      <p>Bring the workflow, the evidence requirements, and the operating constraints.</p>
    </div>
    <div class="eh-action-row">
      <a class="eh-btn" href="{{ '/contact/' | relative_url }}">Talk to Mehrdad</a>
    </div>
  </section>
</section>
